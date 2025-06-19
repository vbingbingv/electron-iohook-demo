const { app, BrowserWindow, Menu, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const { SelectionHook, getActiveWindow, getProcessId, startInputListener } = require('./iohook-rust');

// 保持对window对象的全局引用，如果你不这样做，当JavaScript对象被垃圾回收时，窗口会被自动关闭
let mainWindow;
let toolbarWindow;

// 安全地加载 SelectionHook 模块
let ioHook = null;
try {
  if (SelectionHook) {
    console.log('SelectionHook 模块加载成功:', SelectionHook);
    ioHook = new SelectionHook();
    console.log('SelectionHook 实例创建成功');
  }
} catch (error) {
  console.warn('无法加载 SelectionHook 模块:', error.message);
  console.log('应用将继续运行，但不包含文本选择监听功能');
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // 可选：应用图标
    titleBarStyle: 'default',
    show: false // 初始时不显示，等待ready-to-show事件
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 当窗口准备好显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    const currentProcessId = getProcessId()
    console.log('当前进程id:', currentProcessId);

    startInputListener(null, async mouse => {
      if (mouse.type !== 'mousemove' && mouse.type !== 'wheel') {
        if (mouse.type === 'mouseup') {
          // 获取窗口信息
          const windowInfo = await getActiveWindow();
          if (toolbarWindow && toolbarWindow.isFocused()) {
            console.log('鼠标事件:', mouse, windowInfo.id, windowInfo.title);
            return
          } else {
            console.log(toolbarWindow?.isVisible())
            if (toolbarWindow && toolbarWindow.isVisible()) {
              toolbarWindow.hide()
            }
          }
        }
      }
    })
    
    // 安全地启动文本选择监听
    if (ioHook) {
      try {
        ioHook.on('text-selection', async (data) => {
          console.log('检测到文本选择:', data);
          
          try {
            // 获取窗口信息
            const windowInfo = await getActiveWindow();
            const processId = windowInfo.info.process_id;
            
            console.log('当前窗口信息:', windowInfo);
            console.log('当前进程id:', processId);
            
            // 构造完整的数据发送给渲染进程
            const enrichedData = {
              ...data,
              windowTitle: windowInfo?.title || '未知窗口',
              processId: processId,
              source: windowInfo?.processName || windowInfo?.title || '未知应用',
              timestamp: new Date().toISOString()
            };
            
            // 发送给渲染进程
            mainWindow.webContents.send('text-selection', enrichedData);
          } catch (error) {
            console.error('处理文本选择数据时出错:', error);
            
            // 即使出错也要发送基本数据
            mainWindow.webContents.send('text-selection', {
              ...data,
              windowTitle: '获取失败',
              processId: '未知',
              source: '未知应用',
              timestamp: new Date().toISOString()
            });
          }
        });
        
        ioHook.start();
        console.log('文本选择监听已启动');
      } catch (error) {
        console.error('启动文本选择监听失败:', error);
        // 不阻断应用继续运行
      }
    }
  });

  // 当窗口被关闭时，取消引用window对象
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 创建菜单
  createMenu();
}

function createToolbarWindow() {
  // 如果工具栏窗口已存在，则聚焦它
  if (toolbarWindow) {
    console.log(11111, toolbarWindow.isVisible())
    if (!toolbarWindow.isVisible()) {
      toolbarWindow.show()
      return;
    }
  }

  // 创建工具栏窗口
  toolbarWindow = new BrowserWindow({
    width: 360,
    height: 80,
    minWidth: 300,
    minHeight: 60,
    maxHeight: 120,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden'
  });

  // 加载工具栏页面
  toolbarWindow.loadFile('toolbar.html');

  // 设置窗口位置（屏幕右上角）
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  toolbarWindow.setPosition(width - 380, 20);

  // 当工具栏窗口关闭时，清理引用
  toolbarWindow.on('closed', () => {
    toolbarWindow = null;
  });

  // 开发模式下可以打开开发者工具
  if (process.argv.includes('--dev')) {
    toolbarWindow.webContents.openDevTools();
  }
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 新建功能
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: '文本文件', extensions: ['txt'] },
                { name: '所有文件', extensions: ['*'] }
              ]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 Electron Demo',
              message: 'Electron Demo v1.0.0',
              detail: '这是一个使用 Electron 构建的演示应用程序。'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 清理 ioHook 资源
  if (ioHook) {
    try {
      ioHook.stop();
      console.log('文本选择监听已停止');
    } catch (error) {
      console.error('停止文本选择监听时出错:', error);
    }
  }
  
  // 在macOS上，应用和菜单栏会保持活跃，直到用户明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC处理器
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('open-toolbar', () => {
  createToolbarWindow();
  return { success: true };
}); 