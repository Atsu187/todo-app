/* ========================================

日付に関する共通処理

======================================== */


/* ========================================

期限を「月/日」で表示

======================================== */

export const formatMonthDay = (
  value: string | null
) => {
  if (!value) {
    return 'なし'
  }

  const [year, month, day] =
    value
      .split('-')
      .map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return value
  }

  return `${month}/${day}`
}


/* ========================================

Today画面の日付表示

======================================== */

export const formatTodayTitle = (
  date: Date
) => {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}


/* ========================================

ローカル時間の日付キー

======================================== */

export const getLocalDateKey = (
  date: Date
) => {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}


/* ========================================

日付キーからDateを作る

======================================== */

export const dateKeyToDate = (
  value: string
) => {
  const [year, month, day] =
    value
      .split('-')
      .map(Number)

  return new Date(
    year,
    month - 1,
    day
  )
}


/* ========================================

日付へ日数を加える

======================================== */

export const addDaysToDateKey = (
  value: string,
  amount: number
) => {
  const date =
    dateKeyToDate(
      value
    )

  date.setDate(
    date.getDate() + amount
  )

  return getLocalDateKey(
    date
  )
}


/* ========================================

明日の日付キー

======================================== */

export const getTomorrowDateKey = (
  date: Date = new Date()
) => {
  const tomorrow =
    new Date(date)

  tomorrow.setDate(
    tomorrow.getDate() + 1
  )

  return getLocalDateKey(
    tomorrow
  )
}


/* ========================================

指定した月の日数

======================================== */

export const getDaysInMonth = (
  year: number,
  month: number
) => {
  return new Date(
    year,
    month + 1,
    0
  ).getDate()
}


/* ========================================

月初の曜日

======================================== */

export const getFirstDayOfMonth = (
  year: number,
  month: number
) => {
  return new Date(
    year,
    month,
    1
  ).getDay()
}


/* ========================================

日付キー同士を比較

======================================== */

export const isDateBefore = (
  first: string,
  second: string
) => {
  return first < second
}
