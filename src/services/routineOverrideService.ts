/* ========================================

Supabase 日別ルーティン時刻通信

======================================== */

import { supabase } from './supabase'
import type {
  RoutineTimeOverride,
} from '../types/routine'


/* ========================================

Supabase側の日別ルーティン時刻型

======================================== */

type RoutineOverrideRow = {
  id: number
  user_id: string
  routine_id: number
  date: string
  start_time: string | null
  duration: number | null
}


/* ========================================

時刻をSupabase形式へ変換

======================================== */

const toStartTime = (
  value: string | null
) => {
  if (!value) {
    return null
  }

  return value.length === 5
    ? `${value}:00`
    : value
}


/* ========================================

Supabase形式からアプリ形式へ変換

======================================== */

const fromRoutineOverrideRow = (
  row: RoutineOverrideRow
): RoutineTimeOverride => ({
  routineId: Number(row.routine_id),

  date: row.date,

  scheduledTime:
    row.start_time
      ? row.start_time.slice(0, 5)
      : null,
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

日別ルーティン時刻一覧取得

======================================== */

export const fetchRoutineOverrides =
  async (): Promise<RoutineTimeOverride[]> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } = await supabase
      .from('routine_overrides')
      .select('*')
      .eq('user_id', userId)
      .order('date', {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return (
      data as RoutineOverrideRow[]
    ).map(fromRoutineOverrideRow)
  }


/* ========================================

日別ルーティン時刻保存

user_id + routine_id + date が
同じ場合は更新する

======================================== */

export const saveRoutineOverride =
  async (
    override: RoutineTimeOverride
  ): Promise<RoutineTimeOverride> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } = await supabase
      .from('routine_overrides')
      .upsert(
        {
          user_id: userId,

          routine_id:
            override.routineId,

          date:
            override.date,

          start_time:
            toStartTime(
              override.scheduledTime
            ),

          duration: null,
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

    return fromRoutineOverrideRow(
      data as RoutineOverrideRow
    )
  }


/* ========================================

日別ルーティン時刻削除

======================================== */

export const deleteRoutineOverrideFromSupabase =
  async (
    routineId: number,
    date: string
  ) => {
    const userId =
      await getCurrentUserId()

    const {
      error,
    } = await supabase
      .from('routine_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .eq('date', date)

    if (error) {
      throw error
    }
  }
