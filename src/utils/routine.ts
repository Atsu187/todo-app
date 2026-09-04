/* ========================================

ルーティン共通処理

======================================== */

import type {
  RoutineItem,
  RoutineTimeOverride,
  RoutineType,
} from '../types/routine'

import {
  minutesToTimeString,
  timeStringToMinutes,
} from './time'


/* ========================================

指定日のルーティン時刻を取得

日別変更あり
→ 日別変更を使用

変更なし
→ 基本時刻を使用

======================================== */

export const getRoutineTimeForDate = (
  routine: RoutineItem,
  date: string,
  overrides: RoutineTimeOverride[]
) => {
  const override =
    overrides.find(
      (item) =>
        item.routineId === routine.id &&
        item.date === date
    )

  if (override) {
    return override.scheduledTime
  }

  return routine.defaultTime
}


/* ========================================

指定日のルーティンを
実際の予定時刻順に並べる

時間なしは最後

======================================== */

export const sortRoutinesForDate = (
  routines: RoutineItem[],
  date: string,
  overrides: RoutineTimeOverride[]
) => {
  return [...routines].sort(
    (first, second) => {
      const firstTime =
        getRoutineTimeForDate(
          first,
          date,
          overrides
        )

      const secondTime =
        getRoutineTimeForDate(
          second,
          date,
          overrides
        )

      const firstMinutes =
        firstTime
          ? timeStringToMinutes(
              firstTime
            )
          : null

      const secondMinutes =
        secondTime
          ? timeStringToMinutes(
              secondTime
            )
          : null

      if (
        firstMinutes === null &&
        secondMinutes === null
      ) {
        return first.order - second.order
      }

      if (firstMinutes === null) {
        return 1
      }

      if (secondMinutes === null) {
        return -1
      }

      return firstMinutes - secondMinutes
    }
  )
}


/* ========================================

ルーティン全体を
指定分だけずらす

時間なしの項目は変更しない

======================================== */

export const shiftRoutineTimes = (
  routines: RoutineItem[],
  type: RoutineType,
  date: string,
  overrides: RoutineTimeOverride[],
  shiftMinutes: number
) => {
  const result:
    Record<number, string | null> = {}

  routines
    .filter(
      (routine) =>
        routine.type === type
    )
    .forEach(
      (routine) => {
        const currentTime =
          getRoutineTimeForDate(
            routine,
            date,
            overrides
          )

        if (!currentTime) {
          result[routine.id] = null
          return
        }

        const currentMinutes =
          timeStringToMinutes(
            currentTime
          )

        if (currentMinutes === null) {
          result[routine.id] = null
          return
        }

        const shifted =
          Math.max(
            0,
            Math.min(
              23 * 60 + 59,
              currentMinutes +
                shiftMinutes
            )
          )

        result[routine.id] =
          minutesToTimeString(
            shifted
          )
      }
    )

  return result
}


/* ========================================

所要時間から
後続ルーティンを自動配置

グループの最初の時刻を基準にする

======================================== */

export const autoArrangeRoutineTimes = (
  routines: RoutineItem[],
  type: RoutineType,
  date: string,
  overrides: RoutineTimeOverride[]
) => {
  const group =
    [...routines]
      .filter(
        (routine) =>
          routine.type === type
      )
      .sort(
        (first, second) =>
          first.order - second.order
      )

  const result:
    Record<number, string | null> = {}

  if (group.length === 0) {
    return result
  }

  const firstTime =
    getRoutineTimeForDate(
      group[0],
      date,
      overrides
    )

  if (!firstTime) {
    return result
  }

  let currentMinutes =
    timeStringToMinutes(
      firstTime
    )

  if (currentMinutes === null) {
    return result
  }

  group.forEach(
    (routine) => {
      result[routine.id] =
        minutesToTimeString(
          currentMinutes as number
        )

      currentMinutes =
        Math.min(
          23 * 60 + 59,
          (currentMinutes as number) +
            routine.durationMinutes
        )
    }
  )

  return result
}
