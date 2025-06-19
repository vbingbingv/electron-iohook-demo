// 渲染进程脚本 - 处理UI交互和与主进程通信

class ElectronDemo {
  constructor() {
    this.currentTheme = 'light';
    this.selectionData = {
      logs: [],
      stats: {
        totalSelections: 0,
        longestTextLength: 0,
        mostUsedApp: '',
        appCounts: {},
        startTime: new Date()
      }
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSystemInfo();
    this.setupMenuListeners();
    this.updateStatus('应用程序已就绪');
  }

  setupEventListeners() {
    // 标签页切换
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // 主题切换
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // 关于按钮
    document.getElementById('about-btn').addEventListener('click', () => {
      this.showAbout();
    });

    // 文件操作
    document.getElementById('save-file').addEventListener('click', () => {
      this.saveFile();
    });

    document.getElementById('clear-editor').addEventListener('click', () => {
      this.clearEditor();
    });

    // 通知按钮
    document.getElementById('show-info-notification').addEventListener('click', () => {
      this.showNotification('info', '信息通知', '这是一个信息通知示例');
    });

    document.getElementById('show-success-notification').addEventListener('click', () => {
      this.showNotification('success', '成功通知', '操作已成功完成！');
    });

    document.getElementById('show-warning-notification').addEventListener('click', () => {
      this.showNotification('warning', '警告通知', '请注意这个警告信息');
    });

    document.getElementById('show-error-notification').addEventListener('click', () => {
      this.showNotification('error', '错误通知', '发生了一个错误');
    });

    // 对话框按钮
    document.getElementById('show-info-dialog').addEventListener('click', () => {
      this.showDialog('info', '信息', '这是一个信息对话框示例');
    });

    document.getElementById('show-question-dialog').addEventListener('click', () => {
      this.showDialog('question', '确认', '您确定要执行此操作吗？');
    });

    document.getElementById('show-warning-dialog').addEventListener('click', () => {
      this.showDialog('warning', '警告', '此操作可能有风险，请谨慎操作');
    });

    // 文本选择页面相关事件
    document.getElementById('clear-selection-log').addEventListener('click', () => {
      this.clearSelectionLog();
    });

    // 工具栏按钮事件
    document.getElementById('open-toolbar').addEventListener('click', () => {
      this.openToolbar();
    });
  }

  setupMenuListeners() {
    // 监听菜单事件
    if (window.electronAPI) {
      window.electronAPI.onMenuNewFile(() => {
        this.newFile();
      });

      window.electronAPI.onMenuOpenFile((event, filePath) => {
        this.openFile(filePath);
      });

      // 监听文本选择事件
      window.electronAPI.onTextSelection((event, data) => {
        this.handleTextSelection(data);
      });
    }
  }

  switchTab(tabId) {
    // 移除所有active类
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // 添加active类到选中的标签
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    this.updateStatus(`切换到 ${this.getTabName(tabId)} 页面`);
  }

  getTabName(tabId) {
    const names = {
      'welcome': '欢迎',
      'file-operations': '文件操作',
      'system-info': '系统信息',
      'notifications': '通知',
      'text-selection': '文本选择'
    };
    return names[tabId] || tabId;
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    
    this.updateStatus(`切换到${this.currentTheme === 'light' ? '明亮' : '暗色'}主题`);
  }

  async showAbout() {
    if (window.electronAPI) {
      try {
        const version = await window.electronAPI.getAppVersion();
        await window.electronAPI.showMessageBox({
          type: 'info',
          title: '关于 Electron Demo',
          message: `Electron Demo v${version}`,
          detail: '这是一个使用 Electron 构建的演示应用程序，展示了桌面应用开发的基本功能。\n\n功能特性：\n• 现代化用户界面\n• 文件操作\n• 系统信息获取\n• 通知系统\n• 主题切换',
          buttons: ['确定']
        });
      } catch (error) {
        console.error('显示关于对话框时出错:', error);
      }
    }
  }

  async loadSystemInfo() {
    try {
      // 获取应用版本
      if (window.electronAPI) {
        const appVersion = await window.electronAPI.getAppVersion();
        document.getElementById('app-version').textContent = appVersion;
      }

      // 获取其他版本信息
      document.getElementById('electron-version').textContent = process.versions.electron || 'N/A';
      document.getElementById('node-version').textContent = process.versions.node || 'N/A';
      document.getElementById('chrome-version').textContent = process.versions.chrome || 'N/A';
      document.getElementById('platform').textContent = navigator.platform;
      document.getElementById('user-agent').textContent = navigator.userAgent;
    } catch (error) {
      console.error('加载系统信息时出错:', error);
    }
  }

  async saveFile() {
    const content = document.getElementById('text-editor').value;
    
    if (!content.trim()) {
      this.showNotification('warning', '警告', '文本编辑器为空，无法保存');
      return;
    }

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.showSaveDialog({
          title: '保存文件',
          defaultPath: 'untitled.txt',
          filters: [
            { name: '文本文件', extensions: ['txt'] },
            { name: '所有文件', extensions: ['*'] }
          ]
        });

        if (!result.canceled) {
          // 这里应该调用文件写入API，但为了简化演示，我们只显示消息
          this.showNotification('success', '保存成功', `文件已保存到: ${result.filePath}`);
          this.updateFileInfo('新建文件', content.length, new Date().toLocaleString());
        }
      } catch (error) {
        console.error('保存文件时出错:', error);
        this.showNotification('error', '保存失败', '保存文件时发生错误');
      }
    }
  }

  clearEditor() {
    document.getElementById('text-editor').value = '';
    document.getElementById('file-info').textContent = '选择或创建文件后，相关信息将显示在这里';
    this.updateStatus('编辑器已清空');
  }

  newFile() {
    this.clearEditor();
    this.switchTab('file-operations');
    document.getElementById('text-editor').focus();
    this.updateStatus('新建文件');
  }

  openFile(filePath) {
    this.switchTab('file-operations');
    // 这里应该读取文件内容，但为了简化演示，我们只显示文件路径
    document.getElementById('text-editor').value = `文件路径: ${filePath}\n\n（在实际应用中，这里会显示文件的实际内容）`;
    this.updateFileInfo(filePath, 0, new Date().toLocaleString());
    this.updateStatus(`打开文件: ${filePath}`);
  }

  updateFileInfo(name, size, modified) {
    document.getElementById('file-info').innerHTML = `
      <strong>文件名:</strong> ${name}<br>
      <strong>大小:</strong> ${size} 字符<br>
      <strong>修改时间:</strong> ${modified}
    `;
  }

  showNotification(type, title, message) {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      console.log('此浏览器不支持桌面通知');
      return;
    }

    // 检查通知权限
    if (Notification.permission === 'granted') {
      this.createNotification(title, message);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(title, message);
        }
      });
    }

    this.updateStatus(`${type.toUpperCase()}: ${message}`);
  }

  createNotification(title, message) {
    const notification = new Notification(title, {
      body: message,
      icon: './assets/icon.png' // 可选：通知图标
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 自动关闭通知
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  async showDialog(type, title, message) {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.showMessageBox({
          type: type,
          title: title,
          message: message,
          buttons: type === 'question' ? ['是', '否'] : ['确定'],
          defaultId: 0
        });

        if (type === 'question') {
          const answer = result.response === 0 ? '是' : '否';
          this.updateStatus(`用户选择: ${answer}`);
        }
      } catch (error) {
        console.error('显示对话框时出错:', error);
      }
    }
  }

  updateStatus(message) {
    document.getElementById('status-text').textContent = message;
    console.log(`状态更新: ${message}`);
  }

  // 文本选择相关方法
  handleTextSelection(data) {
    console.log('渲染进程接收到文本选择数据:', data);
    
    // 从 main.js 的数据中提取信息
    const selectionInfo = {
      text: data.text || '无文本',
      timestamp: new Date(),
      windowTitle: data.windowTitle || '未知窗口',
      processId: data.processId || '未知',
      source: data.source || '未知应用'
    };

    // 更新当前选择信息
    this.updateCurrentSelectionInfo(selectionInfo);
    
    // 添加到日志
    this.addSelectionLog(selectionInfo);
    
    // 更新统计信息
    this.updateSelectionStats(selectionInfo);
    
    // 更新状态指示器
    this.updateSelectionIndicator(true);
    
    // 2秒后重置指示器
    setTimeout(() => {
      this.updateSelectionIndicator(false);
    }, 2000);
  }

  updateCurrentSelectionInfo(info) {
    document.getElementById('current-text').textContent = info.text;
    document.getElementById('current-text').title = info.text; // 完整文本的tooltip
    document.getElementById('current-window-title').textContent = info.windowTitle;
    document.getElementById('current-process-id').textContent = info.processId;
    document.getElementById('current-selection-time').textContent = info.timestamp.toLocaleString();
  }

  addSelectionLog(info) {
    // 移除占位符
    const placeholder = document.querySelector('.log-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // 添加到数据存储
    this.selectionData.logs.unshift(info);
    
    // 限制日志数量，最多保存 100 条
    if (this.selectionData.logs.length > 100) {
      this.selectionData.logs.pop();
    }

    // 创建日志条目
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
      <div class="log-entry-header">
        <span class="log-entry-source">${info.source}</span>
        <span class="log-entry-time">${info.timestamp.toLocaleTimeString()}</span>
      </div>
      <div class="log-entry-text">${this.escapeHtml(info.text)}</div>
    `;

    // 添加到日志容器顶部
    const logContainer = document.getElementById('selection-log');
    logContainer.insertBefore(logEntry, logContainer.firstChild);

    // 自动滚动（如果启用）
    if (document.getElementById('auto-scroll-log').checked) {
      logContainer.scrollTop = 0;
    }

    // 更新计数
    document.getElementById('selection-count').textContent = `总计: ${this.selectionData.logs.length} 次`;
  }

  updateSelectionStats(info) {
    const stats = this.selectionData.stats;
    
    // 更新总数
    stats.totalSelections++;
    
    // 更新最长文本
    if (info.text.length > stats.longestTextLength) {
      stats.longestTextLength = info.text.length;
    }
    
    // 更新应用统计
    if (info.source) {
      stats.appCounts[info.source] = (stats.appCounts[info.source] || 0) + 1;
      
      // 找出最常用的应用
      let maxCount = 0;
      let mostUsedApp = '';
      for (const [app, count] of Object.entries(stats.appCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostUsedApp = app;
        }
      }
      stats.mostUsedApp = mostUsedApp;
    }

    // 更新 UI
    document.getElementById('total-selections').textContent = stats.totalSelections;
    document.getElementById('longest-text-length').textContent = `${stats.longestTextLength} 字符`;
    document.getElementById('most-used-app').textContent = stats.mostUsedApp || '-';
    document.getElementById('monitoring-start-time').textContent = stats.startTime.toLocaleString();
  }

  updateSelectionIndicator(active) {
    const indicator = document.getElementById('selection-indicator');
    const statusText = document.getElementById('selection-status-text');
    
    if (active) {
      indicator.classList.add('active');
      statusText.textContent = '检测到文本选择!';
    } else {
      indicator.classList.remove('active');
      statusText.textContent = '等待文本选择...';
    }
  }

  clearSelectionLog() {
    // 清空数据
    this.selectionData.logs = [];
    this.selectionData.stats = {
      totalSelections: 0,
      longestTextLength: 0,
      mostUsedApp: '',
      appCounts: {},
      startTime: new Date()
    };

    // 清空UI
    const logContainer = document.getElementById('selection-log');
    logContainer.innerHTML = '<div class="log-placeholder">暂无选择记录，请在其他应用中选择文本...</div>';
    
    // 重置当前选择信息
    document.getElementById('current-text').textContent = '无';
    document.getElementById('current-window-title').textContent = '-';
    document.getElementById('current-process-id').textContent = '-';
    document.getElementById('current-selection-time').textContent = '-';
    
    // 重置统计信息
    document.getElementById('selection-count').textContent = '总计: 0 次';
    document.getElementById('total-selections').textContent = '0';
    document.getElementById('longest-text-length').textContent = '0 字符';
    document.getElementById('most-used-app').textContent = '-';
    document.getElementById('monitoring-start-time').textContent = new Date().toLocaleString();

    this.updateStatus('文本选择日志已清空');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 打开工具栏窗口
  async openToolbar() {
    if (window.electronAPI) {
      try {
        await window.electronAPI.openToolbar();
        this.updateStatus('工具栏窗口已打开');
      } catch (error) {
        console.error('打开工具栏失败:', error);
        this.updateStatus('打开工具栏失败');
      }
    }
  }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new ElectronDemo();
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// 全局错误处理
window.addEventListener('error', (error) => {
  console.error('应用程序错误:', error);
});

// 防止页面被拖拽文件时打开文件
document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
}); 