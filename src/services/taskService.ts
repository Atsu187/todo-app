/* ========================================

Supabase タスク通信

======================================== */

import { supabase } from './supabase'
import type {
  Priority,
  Task,
} from '../types/task'


/* ========================================

Supabase側のタスク型

======================================== */

type TaskRow = {
  id: string
  user_id: string
  title: string
  task_date: string
  due_date: string | null
  start_time: string | null
  duration: number
  priority: Priority
  completed: boolean
  memo: string
  completed_date: string | null
}


/* ========================================

開始時刻をSupabase形式へ変換

======================================== */

const toStartTime = (
  task: Task
) => {
  if (
    task.startHour === null ||
    task.startMinute === null
  ) {
    return null
  }

  const hour =
    String(task.startHour)
      .padStart(2, '0')

  const minute =
    String(task.startMinute)
      .padStart(2, '0')

  return `${hour}:${minute}:00`
}


/* ========================================

Supabase形式から
アプリのTask形式へ変換

======================================== */

const fromTaskRow = (
  row: TaskRow
): Task => {
  let startHour: number | null =
    null

  let startMinute: number | null =
    null

  let endHour: number | null =
    null

  let endMinute: number | null =
    null

  if (row.start_time) {
    const [
      hourText,
      minuteText,
    ] =
      row.start_time.split(':')

    startHour =
      Number(hourText)

    startMinute =
      Number(minuteText)

    const startTotal =
      startHour * 60 +
      startMinute

    const endTotal =
      startTotal +
      row.duration

    endHour =
      Math.floor(
        endTotal / 60
      )

    endMinute =
      endTotal % 60
  }

  return {
    id: row.id,

    title: row.title,

    durationMinutes:
      row.duration,

    priority:
      row.priority,

    dueDate:
      row.due_date,

    taskDate:
      row.task_date,

    startHour,

    startMinute,

    endHour,

    endMinute,

    memo:
      row.memo ?? '',

    completed:
      row.completed,

    completedDate:
      row.completed_date,
  }
}


/* ========================================

ログインユーザー取得

======================================== */

const getCurrentUserId =
  async () => {
    const {
      data,
      error,
    } =
      await supabase.auth
        .getUser()

    if (error) {
      throw error
    }

    if (!data.user) {
      throw new Error(
        'ログインしていません'
      )
    }

    return data.user.id
  }


/* ========================================

タスク一覧取得

======================================== */

export const fetchTasks =
  async (): Promise<Task[]> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } =
      await supabase
        .from('tasks')
        .select('*')
        .eq(
          'user_id',
          userId
        )
        .order(
          'created_at',
          {
            ascending: true,
          }
        )

    if (error) {
      throw error
    }

    return (
      data as TaskRow[]
    ).map(fromTaskRow)
  }


/* ========================================

タスク新規保存

======================================== */

export const createTask =
  async (
    task: Task
  ): Promise<Task> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } =
      await supabase
        .from('tasks')
        .insert({
          user_id: userId,

          title:
            task.title,

          task_date:
            task.taskDate,

          due_date:
            task.dueDate,

          start_time:
            toStartTime(task),

          duration:
            task.durationMinutes,

          priority:
            task.priority,

          completed:
            task.completed,

          memo:
            task.memo,

          completed_date:
            task.completedDate,
        })
        .select()
        .single()

    if (error) {
      throw error
    }

    return fromTaskRow(
      data as TaskRow
    )
  }


/* ========================================

タスク更新

======================================== */

export const updateTask =
  async (
    task: Task
  ): Promise<Task> => {
    if (
      typeof task.id !==
      'string'
    ) {
      throw new Error(
        'Supabase未登録のタスクです'
      )
    }

    const {
      data,
      error,
    } =
      await supabase
        .from('tasks')
        .update({
          title:
            task.title,

          task_date:
            task.taskDate,

          due_date:
            task.dueDate,

          start_time:
            toStartTime(task),

          duration:
            task.durationMinutes,

          priority:
            task.priority,

          completed:
            task.completed,

          memo:
            task.memo,

          completed_date:
            task.completedDate,
        })
        .eq(
          'id',
          task.id
        )
        .select()
        .single()

    if (error) {
      throw error
    }

    return fromTaskRow(
      data as TaskRow
    )
  }


/* ========================================

タスク削除

======================================== */

export const deleteTaskFromSupabase =
  async (
    taskId: string
  ) => {
    const {
      error,
    } =
      await supabase
        .from('tasks')
        .delete()
        .eq(
          'id',
          taskId
        )

    if (error) {
      throw error
    }
  }