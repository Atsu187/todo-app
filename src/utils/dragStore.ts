/* ========================================

Today画面ドラッグ共有状態

HTML Drag & Dropでは
DragOver中にdataTransferの値を
読めないブラウザがあるため、
ドラッグ中のタスクIDを共有する

======================================== */

import type { TaskId } from '../types/task'

let activeTodoTaskId: TaskId | null = null

export const setActiveTodoTaskId = (
  taskId: TaskId
) => {
  activeTodoTaskId = taskId
}

export const getActiveTodoTaskId = () => {
  return activeTodoTaskId
}

export const clearActiveTodoTaskId = () => {
  activeTodoTaskId = null
}
