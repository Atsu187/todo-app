/* ========================================

Supabase 日別ルーティン結果通信

======================================== */

import { supabase } from './supabase'
import type {
  RoutineDayState,
} from '../types/routine'


/* ========================================

Supabase側の日別ルーティン結果型

======================================== */

type RoutineStateRow = {
  id: number
  user_id: string
  routine_id: number
  date: string
  status: 'completed' | 'skipped'
}


/* ========================================

Supabase形式からアプリ形式へ変換

======================================== */

const fromRoutineStateRow = (
  row: RoutineStateRow
): RoutineDayState => ({
  date: row.date,

  routineId: Number(row.routine_id),

  completed:
    row.status === 'completed',

  skipped:
    row.status === 'skipped',
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

日別ルーティン結果一覧取得

======================================== */

export const fetchRoutineStates =
  async (): Promise<RoutineDayState[]> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } = await supabase
      .from('routine_states')
      .select('*')
      .eq('user_id', userId)
      .order('date', {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return (
      data as RoutineStateRow[]
    ).map(fromRoutineStateRow)
  }


/* ========================================

日別ルーティン結果保存

user_id + routine_id + date が
同じ場合は更新する

======================================== */

export const saveRoutineState =
  async (
    state: RoutineDayState
  ): Promise<RoutineDayState> => {
    const userId =
      await getCurrentUserId()

    if (!state.completed && !state.skipped) {
      throw new Error(
        '未完了状態はSupabaseへ保存しません'
      )
    }

    const status =
      state.skipped
        ? 'skipped'
        : 'completed'

    const {
      data,
      error,
    } = await supabase
      .from('routine_states')
      .upsert(
        {
          user_id: userId,

          routine_id:
            state.routineId,

          date:
            state.date,

          status,
        },
        {
          onConflict:
            'user_id,routine_id,date',
        }
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return fromRoutineStateRow(
      data as RoutineStateRow
    )
  }


/* ========================================

日別ルーティン結果削除

======================================== */

export const deleteRoutineStateFromSupabase =
  async (
    routineId: number,
    date: string
  ) => {
    const userId =
      await getCurrentUserId()

    const {
      error,
    } = await supabase
      .from('routine_states')
      .delete()
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .eq('date', date)

    if (error) {
      throw error
    }
  }
