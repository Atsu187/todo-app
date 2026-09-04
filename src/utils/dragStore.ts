/* ========================================

Today画面ドラッグ共有状態

HTML Drag & Dropでは
DragOver中にdataTransferの値を
読めないブラウザがあるため、
ドラッグ中のタスクIDを共有する

======================================== */

let activeTodoTaskId: number | null = null

export const setActiveTodoTaskId = (
  taskId: number
) => {
  activeTodoTaskId = taskId
}

export const getActiveTodoTaskId = () => {
  return activeTodoTaskId
}

export const clearActiveTodoTaskId = () => {
  activeTodoTaskId = null
}
