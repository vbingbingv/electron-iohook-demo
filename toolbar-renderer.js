// 工具栏渲染进程脚本
class ToolbarApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.showWelcomeEffect();
  }

  setupEventListeners() {
    // 工具按钮事件（目前只是演示效果）
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleToolClick(e.target.closest('.tool-btn'));
      });
    });

    // 窗口控制按钮
    document.querySelector('.minimize-btn').addEventListener('click', () => {
      this.minimizeWindow();
    });

    document.querySelector('.close-btn').addEventListener('click', () => {
      this.closeWindow();
    });

    // 防止拖拽时误触按钮
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  handleToolClick(button) {
    if (!button) return;

    // 添加点击效果
    button.style.transform = 'scale(0.95)';
    button.style.filter = 'brightness(1.2)';
    
    setTimeout(() => {
      button.style.transform = '';
      button.style.filter = '';
    }, 150);

    // 根据按钮类型显示不同的反馈
    const btnClass = button.className;
    let message = '';
    
    if (btnClass.includes('translate-btn')) {
      message = '翻译功能 - 演示模式';
      this.showTooltip(button, '🌐 翻译功能');
    } else if (btnClass.includes('copy-btn')) {
      message = '复制功能 - 演示模式';
      this.showTooltip(button, '📋 复制成功');
    } else if (btnClass.includes('search-btn')) {
      message = '搜索功能 - 演示模式';
      this.showTooltip(button, '🔍 搜索启动');
    } else if (btnClass.includes('note-btn')) {
      message = '笔记功能 - 演示模式';
      this.showTooltip(button, '📝 笔记已添加');
    } else if (btnClass.includes('save-btn')) {
      message = '保存功能 - 演示模式';
      this.showTooltip(button, '💾 保存成功');
    } else if (btnClass.includes('share-btn')) {
      message = '分享功能 - 演示模式';
      this.showTooltip(button, '📤 分享准备就绪');
    }

    console.log(message);
  }

  showTooltip(button, text) {
    // 创建临时提示
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      white-space: nowrap;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    // 定位提示框
    const rect = button.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    
    // 显示动画
    setTimeout(() => {
      tooltip.style.opacity = '1';
    }, 10);
    
    // 自动移除
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 200);
    }, 1500);
  }

  minimizeWindow() {
    // 最小化效果
    document.body.style.transform = 'scale(0.8)';
    document.body.style.opacity = '0.5';
    
    setTimeout(() => {
      document.body.style.transform = '';
      document.body.style.opacity = '';
    }, 200);
    
    console.log('最小化窗口 - 演示模式');
  }

  closeWindow() {
    // 关闭动画效果
    document.body.style.transform = 'scale(0.9)';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
      } else {
        window.close();
      }
    }, 200);
  }

  showWelcomeEffect() {
    // 启动时的欢迎动画
    const buttons = document.querySelectorAll('.tool-btn');
    buttons.forEach((btn, index) => {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        btn.style.transition = 'all 0.3s ease';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, index * 100);
    });

    // 显示欢迎提示
    setTimeout(() => {
      this.showWelcomeMessage();
    }, 800);
  }

  showWelcomeMessage() {
    const welcomeMsg = document.createElement('div');
    welcomeMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    `;
    welcomeMsg.textContent = '🛠️ 工具栏已就绪';
    
    document.body.appendChild(welcomeMsg);
    
    setTimeout(() => {
      welcomeMsg.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      welcomeMsg.style.opacity = '0';
      setTimeout(() => {
        if (welcomeMsg.parentNode) {
          welcomeMsg.parentNode.removeChild(welcomeMsg);
        }
      }, 300);
    }, 2000);
  }
}

// 当DOM加载完成后初始化工具栏应用
document.addEventListener('DOMContentLoaded', () => {
  new ToolbarApp();
});

// 防止上下文菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// 防止文本选择
document.addEventListener('selectstart', (e) => {
  e.preventDefault();
});

// 全局错误处理
window.addEventListener('error', (error) => {
  console.error('工具栏应用错误:', error);
}); 