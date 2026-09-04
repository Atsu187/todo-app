/* ========================================

朝・夜ルーティンの種類

======================================== */

export type RoutineType =
  | 'morning'
  | 'evening'


/* ========================================

ルーティン基本設定

defaultTime
→ 普段使用する基本時刻

null
→ 時間未設定のルーティン

durationMinutes
→ 所要時間

======================================== */

export type RoutineItem = {
  id: number

  title: string

  type: RoutineType

  order: number

  defaultTime: string | null

  durationMinutes: number
}


/* ========================================

特定の日だけ変更する時刻

基本時刻そのものは変更しない

======================================== */

export type RoutineTimeOverride = {
  routineId: number

  date: string

  scheduledTime: string | null
}


/* ========================================

その日のルーティン結果

completed
→ やった

skipped
→ 今日はやらない

実際に行った時刻は保存しない

======================================== */

export type RoutineDayState = {
  date: string

  routineId: number

  completed: boolean

  skipped: boolean
}


/* ========================================

1日の生活記録

wakeUpTime
→ 実際に起きた時刻

reflection
→ 1日の振り返り

======================================== */

export type DailyLifeLog = {
  date: string

  wakeUpTime: string | null

  reflection: string
}
