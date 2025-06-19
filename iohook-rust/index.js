// 在ES模块中导入原生模块需要使用createRequire
const { SelectionHook } = require('./selection-hook.js')

// 导入生成的原生模块
const ioHookNode = process.platform === 'win32' ? require('./build/index.windows.node') : require('./build/index.mac.node')

module.exports.startInputListener = ioHookNode.start_input_listener
module.exports.stopInputListener = ioHookNode.stop_input_listener
module.exports.getSelectText = ioHookNode.get_select_text
module.exports.getActiveWindow = ioHookNode.get_active_window
module.exports.getProcessId = ioHookNode.get_process_id

module.exports.SelectionHook = SelectionHook