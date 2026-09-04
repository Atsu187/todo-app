/* ========================================

時刻に関する共通処理

======================================== */


/* ========================================

時・分を「HH:MM」に変換

例：
10, 30
↓
10:30

======================================== */

export const formatTime = (
  hour: number,
  minute: number
) => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}


/* ========================================

「HH:MM」を分に変換

例：
10:30
↓
630分

======================================== */

export const timeStringToMinutes = (
  time: string
) => {
  if (!time) {
    return null
  }

  const [hour, minute] = time
    .split(':')
    .map(Number)

  return hour * 60 + minute
}


/* ========================================

分を「HH:MM」に変換

例：
630分
↓
10:30

======================================== */

export const minutesToTimeString = (
  totalMinutes: number
) => {
  const normalizedMinutes = Math.max(
    0,
    Math.min(totalMinutes, 23 * 60 + 59)
  )

  const hour = Math.floor(
    normalizedMinutes / 60
  )

  const minute =
    normalizedMinutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}