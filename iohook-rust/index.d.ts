export interface KeyboardEvent {
  /** 键盘事件类型 */
  type: 'keydown' | 'keyup';
  /** 按键值 */
  key: string;
  /** 事件时间戳（毫秒） */
  timestamp: number;
}

export interface MouseEvent {
  /** 鼠标事件类型 */
  type: 'mousedown' | 'mouseup' | 'mousemove' | 'wheel';
  /** 鼠标X坐标（像素） */
  x?: number;
  /** 鼠标Y坐标（像素） */
  y?: number;
  /** 鼠标按键 */
  button?: string;
  /** X轴滚动量（仅wheel事件） */
  delta_x?: number;
  /** Y轴滚动量（仅wheel事件） */
  delta_y?: number;
  /** 事件时间戳（毫秒） */
  timestamp: number;
}

// 当前窗口的位置信息，注意x和y可能为负数，如果是全屏或者手动移动到了其他位置，则可能为负数
export interface ActiveWindowPosition {
  /** 窗口左上角X坐标，可能为负数 */
  x: number;
  /** 窗口左上角Y坐标，可能为负数 */
  y: number;
  /** 窗口宽度（像素） */
  width: number;
  /** 窗口高度（像素） */
  height: number;
  /** 是否全屏显示 */
  is_full_screen: boolean;
}

export interface ActiveWindowProcessInfo {
  /** 进程名称 */
  name: string;
  /** 可执行文件名称 */
  exec_name: string;
  /** 可执行文件完整路径 */
  path: string;
  /** 进程ID */
  process_id: number;
}

export interface ActiveWindowData {
  /** 窗口ID */
  id: number;
  /** 操作系统标识 */
  os: string;
  /** 窗口标题 */
  title: string;
  /** 窗口位置信息 */
  position: ActiveWindowPosition;
  /** 窗口进程信息 */
  info: ActiveWindowProcessInfo;
}
/**
 * Node 选择钩子
 *
 * 该模块提供了一个 Node.js 接口，用于使用 UI 自动化和可访问性 API 监控 Windows 上跨应用程序的文本选择。
 */

import type { EventEmitter } from "events";

/**
 * 由原生模块返回的文本选择数据
 *
 * 包含所选文本及其位置信息。
 * 位置坐标以屏幕坐标（像素）表示。
 */
export interface TextSelectionData {
  /** 选中的文本内容 */
  text: string;
  /** 触发选择的程序名称 */
  programName: string;
  /** 第一段落的左上角点坐标 (x, y)，单位像素 */
  startTop: { x: number; y: number };
  /** 第一段落的左下角点坐标 (x, y)，单位像素 */
  startBottom: { x: number; y: number };
  /** 最后段落的右上角点坐标 (x, y)，单位像素 */
  endTop: { x: number; y: number };
  /** 最后段落的右下角点坐标 (x, y)，单位像素 */
  endBottom: { x: number; y: number };
  /** 当前鼠标位置坐标 (x, y)，单位像素 */
  mousePosStart: { x: number; y: number };
  /** 鼠标按下位置坐标 (x, y)，单位像素 */
  mousePosEnd: { x: number; y: number };
  /** 选择方法标识符 */
  method: (typeof IOSelectionHook.SelectionMethod)[keyof typeof IOSelectionHook.SelectionMethod];
  /** 位置级别标识符 */
  posLevel: (typeof IOSelectionHook.PositionLevel)[keyof typeof IOSelectionHook.PositionLevel];
}

/**
 * 鼠标事件数据结构
 *
 * 包含有关鼠标事件的信息，如点击和移动。
 * 坐标以屏幕坐标（像素）表示。
 */
export interface MouseEventData {
  /** 鼠标指针的 X 坐标（像素） */
  x: number;
  /** 鼠标指针的 Y 坐标（像素） */
  y: number;
  /** 鼠标按钮标识符，
   * 与 WebAPIs 的 MouseEvent.button 相同
   * 左键 = 0，中键 = 1，右键 = 2，后退键 = 3，前进键 = 4
   */
  button: number;
}

/**
 * 鼠标滚轮事件数据结构
 *
 * 包含有关鼠标滚轮事件的信息。
 */
export interface MouseWheelEventData {
  /** 鼠标滚轮按钮类型
   * 0: 垂直方向
   * 1: 水平方向
   */
  button: number;
  /** 鼠标滚轮方向标志
   * 1: 向上/向右
   * -1: 向下/向左
   */
  flag: number;
}

/**
 * 键盘事件数据结构
 *
 * 包含有关键盘事件的信息，如按键按下和释放。
 */
export interface KeyboardEventData {
  /** 是否按下了系统键（例如，Alt） */
  sys: boolean;
  /** 虚拟键码（Windows VK_* 常量） */
  vkCode: number;
  /** 键盘扫描码 */
  scanCode: number;
  /** 附加按键标志 */
  flags: number;
  /** 内部事件类型标识符 */
  type?: string;
  /** 特定键盘动作（例如，"key-down"，"key-up"） */
  action?: string;
}

export interface SelectionConfig {
  /** 启用警告和错误的调试日志 */
  debug?: boolean;
  /** 启用高 CPU 使用率的鼠标移动跟踪 */
  enableMouseMoveEvent?: boolean;
  /** 启用文本选择的剪贴板备用方案 */
  enableClipboard?: boolean;
  /** 启用被动模式，其中选择需要手动触发 */
  selectionPassiveMode?: boolean;
  /** 剪贴板备用行为的模式 */
  clipboardMode?: (typeof IOSelectionHook.FilterMode)[keyof typeof IOSelectionHook.FilterMode];
  /** 剪贴板模式过滤的程序名称列表 */
  programList?: string[];
}

/**
 * SelectionHook - 文本选择监控的主类
 *
 * 该类提供了启动/停止监控 Windows 上跨应用程序文本选择的方法，
 * 并在发生选择时发出事件。
 */
declare class IOSelectionHook extends EventEmitter {
  static SelectionMethod: {
    NONE: 0;
    UIA: 1;
    FOCUSCTL: 2;
    ACCESSIBLE: 3;
    CLIPBOARD: 4;
  };
  
  static PositionLevel: {
    NONE: 0;
    MOUSE_SINGLE: 1;
    MOUSE_DUAL: 2;
    SEL_FULL: 3;
    SEL_DETAILED: 4;
  };
  
  static FilterMode: {
    DEFAULT: 0;
    INCLUDE_LIST: 1;
    EXCLUDE_LIST: 2;
  };
  
  static FineTunedListType: {
    EXCLUDE_CLIPBOARD_CURSOR_DETECT: 0;
    INCLUDE_CLIPBOARD_DELAY_READ: 1;
  };
  
  /**
   * 开始监控文本选择
   *
   * 初始化原生钩子以监听所有应用程序的文本选择事件。
   * 必须在发出任何事件之前调用此方法。
   *
   * @param config 配置选项，包括调试日志等
   * @returns 成功状态（如果成功启动则为 true）
   */
  start(config?: SelectionConfig | null): boolean;
  
  /**
   * 停止监控文本选择
   *
   * 停止原生钩子并防止进一步发出事件。
   * 当不再需要监控以释放资源时，应调用此方法。
   *
   * @returns 成功状态（如果成功停止或未运行则为 true）
   */
  stop(): boolean;
  
  /**
   * 检查钩子是否正在运行
   *
   * 确定选择监控当前是否处于活动状态。
   *
   * @returns 运行状态（如果监控处于活动状态则为 true）
   */
  isRunning(): boolean;
  
  /**
   * 获取当前文本选择
   *
   * 检索当前文本选择（如果存在）。
   * 如果当前未选择任何文本或钩子未运行，则返回 null。
   *
   * @returns 当前选择数据，如果不存在选择则返回 null
   */
  getCurrentSelection(): TextSelectionData | null;
  
  /**
   * 启用鼠标移动事件（高 CPU 使用率）
   *
   * 使鼠标移动时发出 "mouse-move" 事件。
   * 注意：由于频繁触发事件，这可能导致高 CPU 使用率。
   *
   * @returns 成功状态（如果成功启用则为 true）
   */
  enableMouseMoveEvent(): boolean;
  
  /**
   * 禁用鼠标移动事件
   *
   * 停止发出 "mouse-move" 事件以减少 CPU 使用率。
   * 这是启动钩子后的默认状态。
   *
   * @returns 成功状态（如果成功禁用则为 true）
   */
  disableMouseMoveEvent(): boolean;
  
  /**
   * 启用文本选择的剪贴板备用方案
   *
   * 在其他方法失败时使用 Ctrl+C 作为获取所选文本的最后手段。
   * 这可能会修改剪贴板内容。
   *
   * @returns 成功状态（如果成功启用则为 true）
   */
  enableClipboard(): boolean;
  
  /**
   * 禁用文本选择的剪贴板备用方案
   *
   * 不会使用 Ctrl+C 获取所选文本。
   * 这将保留剪贴板内容。
   *
   * @returns 成功状态（如果成功禁用则为 true）
   */
  disableClipboard(): boolean;
  
  /**
   * 设置文本选择的剪贴板模式和程序列表
   *
   * 配置剪贴板备用机制如何为不同程序工作。
   * 模式可以是：
   * - DEFAULT: 对所有程序使用剪贴板
   * - INCLUDE_LIST: 仅对列表中的程序使用剪贴板
   * - EXCLUDE_LIST: 对除列表中程序外的所有程序使用剪贴板
   *
   * @param {number} mode - 剪贴板模式 (SelectionHook.FilterMode)
   * @param {string[]} programList - 要包含/排除的程序名称数组
   * @returns {boolean} 成功状态
   */
  setClipboardMode(
    mode: (typeof IOSelectionHook.FilterMode)[keyof typeof IOSelectionHook.FilterMode],
    programList?: string[]
  ): boolean;
  
  /**
   * 设置文本选择的全局过滤模式
   *
   * 配置全局过滤机制如何为不同程序工作。
   * 模式可以是：
   * - DEFAULT: 禁用全局过滤
   * - INCLUDE_LIST: 仅对列表中的程序使用全局过滤
   * - EXCLUDE_LIST: 对除列表中程序外的所有程序使用全局过滤
   *
   * @param {number} mode - 过滤模式 (SelectionHook.FilterMode)
   * @param {string[]} programList - 要包含/排除的程序名称数组
   * @returns {boolean} 成功状态
   */
  setGlobalFilterMode(
    mode: (typeof IOSelectionHook.FilterMode)[keyof typeof IOSelectionHook.FilterMode],
    programList?: string[]
  ): boolean;
  
  /**
   * 设置特定行为的微调列表
   *
   * 为特定应用程序行为配置微调列表。
   * 列表类型：
   * - EXCLUDE_CLIPBOARD_CURSOR_DETECT: 排除剪贴板操作的光标检测
   * - INCLUDE_CLIPBOARD_DELAY_READ: 读取剪贴板内容时包含延迟
   *
   * @param {number} listType - 微调列表类型 (SelectionHook.FineTunedListType)
   * @param {string[]} programList - 微调列表的程序名称数组
   * @returns {boolean} 成功状态
   */
  setFineTunedList(
    listType: (typeof IOSelectionHook.FineTunedListType)[keyof typeof IOSelectionHook.FineTunedListType],
    programList?: string[]
  ): boolean;
  
  /**
   * 设置选择被动模式
   * @param {boolean} passive - 被动模式
   * @returns {boolean} 成功状态
   */
  setSelectionPassiveMode(passive: boolean): boolean;
  
  /**
   * 将文本写入剪贴板
   * @param {string} text - 要写入剪贴板的文本
   * @returns {boolean} 成功状态
   */
  writeToClipboard(text: string): boolean;
  
  /**
   * 从剪贴板读取文本
   * @returns {string|null} 剪贴板中的文本，如果为空或出错则返回 null
   */
  readFromClipboard(): string | null;
  
  /**
   * 释放资源
   *
   * 停止监控并释放所有原生资源。
   * 应在应用程序退出前调用，以防止内存泄漏。
   */
  cleanup(): void;
  
  /**
   * 注册事件监听器
   *
   * 钩子会发出各种可以监听的事件：
   */
  
  /**
   * 当在任何应用程序中选择文本时发出
   * @param event 事件名称
   * @param listener 接收选择数据的回调函数
   */
  on(event: "text-selection", listener: (data: TextSelectionData) => void): this;
  
  on(event: "mouse-up", listener: (data: MouseEventData) => void): this;
  on(event: "mouse-down", listener: (data: MouseEventData) => void): this;
  on(event: "mouse-move", listener: (data: MouseEventData) => void): this;
  on(event: "mouse-wheel", listener: (data: MouseWheelEventData) => void): this;
  
  on(event: "key-down", listener: (data: KeyboardEventData) => void): this;
  on(event: "key-up", listener: (data: KeyboardEventData) => void): this;
  
  on(event: "status", listener: (status: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  
  // Same events available with once() for one-time listeners
  once(event: "text-selection", listener: (data: TextSelectionData) => void): this;
  once(event: "mouse-up", listener: (data: MouseEventData) => void): this;
  once(event: "mouse-down", listener: (data: MouseEventData) => void): this;
  once(event: "mouse-move", listener: (data: MouseEventData) => void): this;
  once(event: "mouse-wheel", listener: (data: MouseWheelEventData) => void): this;
  once(event: "key-down", listener: (data: KeyboardEventData) => void): this;
  once(event: "key-up", listener: (data: KeyboardEventData) => void): this;
  once(event: "status", listener: (status: string) => void): this;
  once(event: "error", listener: (error: Error) => void): this;
}

/**
 * SelectionHook 类的实例类型
 */
export type SelectionHookInstance = InstanceType<typeof IOSelectionHook>;

/**
 * SelectionHook 类的构造函数类型
 */
export type SelectionHookConstructor = typeof IOSelectionHook;

/** 启动统一输入监听器，支持键盘和鼠标事件 */
export function startInputListener(keyboardCallback?: ((event: KeyboardEvent) => void) | null, mouseCallback?: ((event: MouseEvent) => void) | null): boolean;

/** 停止输入监听器 */
export function stopInputListener(): boolean;

/** 获取鼠标选中的文本。需要注意如果使用时没有选择任何文本项，会自动focus当前行的文本 */
export function getSelectText(): Promise<string>;

/**
 * 摘自https://github.com/0xfullex/selection-hook，集成到当前项目中，锁版本0.9.23
 * 文本选择监控的配置接口
 *
 * 包含控制文本选择钩子行为的设置
 * 以及其各种功能，如鼠标跟踪和剪贴板备用方案。
 * 目前仅支持windows，其他的后续支持
 */
export const SelectionHook: typeof IOSelectionHook | undefined;

/**
 * 获取当前激活的窗口信息
 */
export function getActiveWindow(): Promise<ActiveWindowData>;
