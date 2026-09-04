/* ========================================

ルーティンの初期データ

・10分単位
・最小10分
・5:00起床

======================================== */

import type {
  RoutineItem,
} from '../types/routine'


export const mockRoutines:
  RoutineItem[] = [

    /* ========================================

    朝ルーティン

    ======================================== */

    {
      id: 1,

      title: '起床',

      type:
        'morning',

      order: 1,

      defaultTime:
        '05:00',

      durationMinutes:
        10,
    },

    {
      id: 2,

      title: '水を飲む',

      type:
        'morning',

      order: 2,

      defaultTime:
        '05:10',

      durationMinutes:
        10,
    },

    {
      id: 3,

      title:
        'ストレッチ',

      type:
        'morning',

      order: 3,

      defaultTime:
        '05:20',

      durationMinutes:
        20,
    },

    {
      id: 4,

      title:
        '朝食',

      type:
        'morning',

      order: 4,

      defaultTime:
        '05:40',

      durationMinutes:
        30,
    },

    {
      id: 5,

      title:
        '読書',

      type:
        'morning',

      order: 5,

      defaultTime:
        '06:10',

      durationMinutes:
        30,
    },


    /* ========================================

    夜ルーティン

    ======================================== */

    {
      id: 6,

      title:
        '入浴',

      type:
        'evening',

      order: 1,

      defaultTime:
        '21:00',

      durationMinutes:
        30,
    },

    {
      id: 7,

      title:
        '明日の準備',

      type:
        'evening',

      order: 2,

      defaultTime:
        '21:30',

      durationMinutes:
        20,
    },

    {
      id: 8,

      title:
        '読書',

      type:
        'evening',

      order: 3,

      defaultTime:
        '21:50',

      durationMinutes:
        30,
    },

    {
      id: 9,

      title:
        '就寝準備',

      type:
        'evening',

      order: 4,

      defaultTime:
        '22:20',

      durationMinutes:
        30,
    },
  ]