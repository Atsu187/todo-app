/* ========================================

Supabase タスク日別結果通信

======================================== */

import { supabase } from './supabase'
import type {
  TaskDayResult,
} from '../types/task'


/* ========================================

Supabase側のタスク日別結果型

======================================== */

type TaskDayResultRow = {
  id: number
  user_id: string
  task_id: string
  date: string
  title: string
  completed: boolean
}


/* ========================================

Supabase形式からアプリ形式へ変換

======================================== */

const fromTaskDayResultRow = (
  row: TaskDayResultRow
): TaskDayResult => ({
  date: row.date,
  taskId: row.task_id,
  title: row.title,
  completed: row.completed,
})


/* ========================================

ログインユーザー取得

======================================== */

const getCurrentUserId = async () => {
  const {
    data,
    error,
  } = await supabase.auth.getUser()

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

タスク日別結果一覧取得

======================================== */

export const fetchTaskDayResults =
  async (): Promise<TaskDayResult[]> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } = await supabase
      .from('task_day_results')
      .select('*')
      .eq('user_id', userId)
      .order('date', {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return (
      data as TaskDayResultRow[]
    ).map(fromTaskDayResultRow)
  }


/* ========================================

タスク日別結果保存

user_id + task_id + date が
同じ場合は更新する

======================================== */

export const saveTaskDayResult =
  async (
    result: TaskDayResult
  ): Promise<TaskDayResult> => {
    const userId =
      await getCurrentUserId()

    if (typeof result.taskId !== 'string') {
      throw new Error(
        'Supabaseへ保存するタスクIDがUUIDではありません'
      )
    }

    const {
      data,
      error,
    } = await supabase
      .from('task_day_results')
      .upsert(
        {
          user_id: userId,
          task_id: result.taskId,
          date: result.date,
          title: result.title,
          completed: result.completed,
        },
        {
          onConflict:
            'user_id,task_id,date',
        }
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return fromTaskDayResultRow(
      data as TaskDayResultRow
    )
  }


/* ========================================

タスク日別結果削除

======================================== */

export const deleteTaskDayResultFromSupabase =
  async (
    taskId: string,
    date: string
  ) => {
    const userId =
      await getCurrentUserId()

    const {
      error,
    } = await supabase
      .from('task_day_results')
      .delete()
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('date', date)

    if (error) {
      throw error
    }
  }
