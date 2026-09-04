/* ========================================

タスクの優先度

======================================== */

export type Priority = '低' | '中' | '高'


/* ========================================

通常タスク

taskDate
→ そのタスクを実行する日

completedDate
→ 完了した日

======================================== */

export type Task = {
  id: number

  title: string

  durationMinutes: number

  priority: Priority

  dueDate: string | null

  taskDate: string

  startHour: number | null

  startMinute: number | null

  endHour: number | null

  endMinute: number | null

  memo: string

  completed: boolean

  completedDate: string | null
}


/* ========================================

1日ごとのタスク結果

過去の日に
「できた / できなかった」を残す

======================================== */

export type TaskDayResult = {
  date: string

  taskId: number

  title: string

  completed: boolean
}
