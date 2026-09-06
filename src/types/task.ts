/* ========================================

タスクの優先度

======================================== */

export type Priority = '低' | '中' | '高'


/* ========================================

タスクID

既存のlocalStorageではnumber、
Supabaseではuuid文字列を使用するため
移行期間は両方を許可する

======================================== */

export type TaskId = number | string


/* ========================================

通常タスク

taskDate
→ そのタスクを実行する日

completedDate
→ 完了した日

======================================== */

export type Task = {
  id: TaskId

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

  taskId: TaskId

  title: string

  completed: boolean
}
