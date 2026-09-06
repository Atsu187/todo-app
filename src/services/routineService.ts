/* ========================================

Supabase ルーティン通信

======================================== */

import { supabase } from './supabase'
import type {
  RoutineItem,
  RoutineType,
} from '../types/routine'


/* ========================================

Supabase側のルーティン型

======================================== */

type RoutineRow = {
  id: number
  user_id: string
  title: string
  type: RoutineType
  order: number
  default_time: string | null
  duration: number
}


/* ========================================

時刻をSupabase形式へ変換

======================================== */

const toDefaultTime = (
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

Supabase形式から
アプリのRoutineItem形式へ変換

======================================== */

const fromRoutineRow = (
  row: RoutineRow
): RoutineItem => ({
  id: Number(row.id),

  title: row.title,

  type: row.type,

  order: row.order,

  defaultTime:
    row.default_time
      ? row.default_time.slice(0, 5)
      : null,

  durationMinutes:
    row.duration,
})


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

ルーティン一覧取得

======================================== */

export const fetchRoutines =
  async (): Promise<RoutineItem[]> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } =
      await supabase
        .from('routines')
        .select('*')
        .eq(
          'user_id',
          userId
        )
        .order(
          'type',
          {
            ascending: true,
          }
        )
        .order(
          'order',
          {
            ascending: true,
          }
        )

    if (error) {
      throw error
    }

    return (
      data as RoutineRow[]
    ).map(fromRoutineRow)
  }


/* ========================================

ルーティン保存

同じidが存在する場合は更新し、
存在しない場合は新規追加する

======================================== */

export const saveRoutine =
  async (
    routine: RoutineItem
  ): Promise<RoutineItem> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } =
      await supabase
        .from('routines')
        .upsert(
          {
            id: routine.id,

            user_id: userId,

            title:
              routine.title,

            type:
              routine.type,

            order:
              routine.order,

            default_time:
              toDefaultTime(
                routine.defaultTime
              ),

            duration:
              routine.durationMinutes,
          },
          {
            onConflict: 'id',
          }
        )
        .select('*')
        .single()

    if (error) {
      throw error
    }

    return fromRoutineRow(
      data as RoutineRow
    )
  }


/* ========================================

ルーティン削除

======================================== */

export const deleteRoutineFromSupabase =
  async (
    routineId: number
  ) => {
    const userId =
      await getCurrentUserId()

    const {
      error,
    } =
      await supabase
        .from('routines')
        .delete()
        .eq(
          'id',
          routineId
        )
        .eq(
          'user_id',
          userId
        )

    if (error) {
      throw error
    }
  }
