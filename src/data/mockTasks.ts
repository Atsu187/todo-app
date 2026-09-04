/* ========================================

開発中の仮タスク

10分刻みに統一

Supabase接続後は
データベースから取得する

======================================== */

import type {
  Task,
} from '../types/task'

import {
  getLocalDateKey,
} from '../utils/date'


/* ========================================

今日の日付

======================================== */

const today =
  getLocalDateKey(
    new Date()
  )


export const mockTasks:
  Task[] = [

    /* ========================================

    60分タスク

    ======================================== */

    {
      id: 1,

      title:
        '論文確認',

      durationMinutes:
        60,

      priority:
        '高',

      dueDate:
        '2026-09-03',

      taskDate:
        today,

      startHour:
        10,

      startMinute:
        30,

      endHour:
        11,

      endMinute:
        30,

      memo:
        '論文の修正箇所を確認する',

      completed:
        false,

      completedDate:
        null,
    },


    /* ========================================

    最小10分タスク

    ======================================== */

    {
      id: 2,

      title:
        '10分タスク',

      durationMinutes:
        10,

      priority:
        '低',

      dueDate:
        today,

      taskDate:
        today,

      startHour:
        11,

      startMinute:
        50,

      endHour:
        12,

      endMinute:
        0,

      memo:
        '',

      completed:
        false,

      completedDate:
        null,
    },


    /* ========================================

    90分タスク

    ======================================== */

    {
      id: 3,

      title:
        '研究資料の整理',

      durationMinutes:
        90,

      priority:
        '中',

      dueDate:
        '2026-09-05',

      taskDate:
        today,

      startHour:
        13,

      startMinute:
        20,

      endHour:
        14,

      endMinute:
        50,

      memo:
        '',

      completed:
        false,

      completedDate:
        null,
    },


    /* ========================================

    時刻未設定ToDo

    ======================================== */

    {
      id: 4,

      title:
        '発表資料修正',

      durationMinutes:
        60,

      priority:
        '高',

      dueDate:
        '2026-09-03',

      taskDate:
        today,

      startHour:
        null,

      startMinute:
        null,

      endHour:
        null,

      endMinute:
        null,

      memo:
        '',

      completed:
        false,

      completedDate:
        null,
    },
  ]