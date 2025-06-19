const { contextBridge, ipcRenderer } = require('electron');

// 将安全的API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 对话框
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // 菜单事件监听
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  
  // 文本选择事件监听
  onTextSelection: (callback) => ipcRenderer.on('text-selection', callback),
  
  // 工具栏窗口
  openToolbar: () => ipcRenderer.invoke('open-toolbar'),
  
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// 当页面加载完成时通知渲染进程
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded');
}); 