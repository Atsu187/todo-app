/* ========================================

Supabase 生活記録通信

======================================== */

import { supabase } from './supabase'
import type { DailyLifeLog } from '../types/routine'


/* ========================================

Supabase側の生活記録型

======================================== */

type LifeLogRow = {
  id: number
  user_id: string
  date: string
  wake_up_time: string | null
  reflection: string
}


/* ========================================

Supabase形式からアプリ形式へ変換

======================================== */

const fromLifeLogRow = (
  row: LifeLogRow
): DailyLifeLog => ({
  date: row.date,
  wakeUpTime:
    row.wake_up_time
      ? row.wake_up_time.slice(0, 5)
      : null,
  reflection: row.reflection ?? '',
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
    throw new Error('ログインしていません')
  }

  return data.user.id
}


/* ========================================

生活記録一覧取得

======================================== */

export const fetchLifeLogs =
  async (): Promise<DailyLifeLog[]> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } = await supabase
      .from('life_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return (
      data as LifeLogRow[]
    ).map(fromLifeLogRow)
  }


/* ========================================

生活記録保存

user_id + date が同じ場合は更新する

======================================== */

export const saveLifeLog =
  async (
    log: DailyLifeLog
  ): Promise<DailyLifeLog> => {
    const userId =
      await getCurrentUserId()

    const {
      data,
      error,
    } = await supabase
      .from('life_logs')
      .upsert(
        {
          user_id: userId,
          date: log.date,
          wake_up_time:
            log.wakeUpTime
              ? `${log.wakeUpTime}:00`
              : null,
          reflection: log.reflection,
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return fromLifeLogRow(
      data as LifeLogRow
    )
  }


/* ========================================

生活記録削除

======================================== */

export const deleteLifeLogFromSupabase =
  async (
    date: string
  ) => {
    const userId =
      await getCurrentUserId()

    const { error } = await supabase
      .from('life_logs')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)

    if (error) {
      throw error
    }
  }
