/* ========================================

アプリ全体の中心

ここでは、

・現在時刻
・表示ページ
・通常タスク
・ルーティン設定
・日別ルーティン時間
・ルーティン結果
・生活記録
・明日の予定調整
・タスク追加 / 編集 / 削除
・未完了タスクの翌日繰越

を管理する

======================================== */

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import './App.css'

import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import TaskModal from './components/TaskModal'
import TomorrowRoutineModal from './components/TomorrowRoutineModal'

import TodayPage from './pages/TodayPage'
import CalendarPage from './pages/CalendarPage'
import TasksPage from './pages/TasksPage'
import RoutinePage from './pages/RoutinePage'
import GoogleCalendarPage from './pages/GoogleCalendarPage'

import type {
  GoogleCalendarEvent,
} from './services/googleCalendar'
import SettingsPage from './pages/SettingsPage'

import {
  supabase,
} from './services/supabase'

import {
  createTask,
  deleteTaskFromSupabase,
  fetchTasks,
  updateTask,
} from './services/taskService'

import {
  deleteRoutineFromSupabase,
  fetchRoutines,
  saveRoutine,
} from './services/routineService'

import {
  deleteRoutineOverrideFromSupabase,
  fetchRoutineOverrides,
  saveRoutineOverride,
} from './services/routineOverrideService'

import {
  deleteRoutineStateFromSupabase,
  fetchRoutineStates,
  saveRoutineState,
} from './services/routineStateService'

import {
  deleteTaskDayResultFromSupabase,
  fetchTaskDayResults,
  saveTaskDayResult,
} from './services/taskDayResultService'

import {
  deleteLifeLogFromSupabase,
  fetchLifeLogs,
  saveLifeLog,
} from './services/lifeLogService'

import type {
  Session,
} from '@supabase/supabase-js'

import type {
  Priority,
  Task,
  TaskId,
  TaskDayResult,
} from './types/task'

import type {
  AppPage,
} from './types/page'

import type {
  DailyLifeLog,
  RoutineDayState,
  RoutineItem,
  RoutineTimeOverride,
} from './types/routine'

import {
  mockTasks,
} from './data/mockTasks'

import {
  mockRoutines,
} from './data/mockRoutines'

import {
  formatTime,
  minutesToTimeString,
  timeStringToMinutes,
} from './utils/time'

import {
  getLocalDateKey,
  getTomorrowDateKey,
  isDateBefore,
} from './utils/date'


/* ========================================

localStorage付きstate

Supabase導入前の仮保存

同じブラウザでは
再読み込みしても残る

======================================== */

function useStoredState<T>(
  key: string,
  initialValue: T
) {
  const [value, setValue] =
    useState<T>(() => {
      try {
        const saved =
          localStorage.getItem(key)

        if (saved) {
          return JSON.parse(saved) as T
        }
      } catch {
        // 保存データが壊れている場合は
        // 初期値を使用する
      }

      return initialValue
    })

  useEffect(() => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      )
    } catch {
      // 保存できなくても
      // アプリの操作は継続する
    }
  }, [key, value])

  return [
    value,
    setValue,
  ] as const
}




/* ========================================

Supabase初回移行の重複実行防止

React開発環境ではuseEffectが
確認のため複数回実行されることがあるため、
同じページ読み込み中の二重移行を防ぐ

======================================== */

const TASK_MIGRATION_KEY =
  'todo-app-tasks-supabase-migrated-v1'

let taskMigrationStarted = false


function TodoApp() {
  /* ========================================

  現在表示ページ

  ======================================== */

  const [currentPage, setCurrentPage] =
    useState<AppPage>('today')


  /* ========================================

  現在時刻

  ======================================== */

  const [now, setNow] =
    useState(
      new Date()
    )

  const todayDate =
    getLocalDateKey(now)

  const tomorrowDate =
    getTomorrowDateKey(now)


  /* ========================================

  タイムラインで表示している日付

  ======================================== */

  const [selectedDate, setSelectedDate] =
    useState(todayDate)


  /* ========================================

  通常タスク

  ======================================== */

  const [tasks, setTasks] =
    useStoredState<Task[]>(
      'todo-app-tasks-v2',
      mockTasks
    )


  /* ========================================

  Supabaseタスク同期状態

  初回読込が完了するまでは
  自動同期を開始しない

  ======================================== */

  const [taskSyncReady, setTaskSyncReady] =
    useState(false)

  const taskSyncQueue =
    useRef(Promise.resolve())


  /* ========================================

  タスクの日別結果

  ======================================== */

  const [taskDayResults, setTaskDayResults] =
    useStoredState<TaskDayResult[]>(
      'todo-app-task-day-results-v1',
      []
    )


  /* ========================================

  localStorage → Supabase
  初回タスク移行

  React開発環境の二重実行を防止し、
  既にSupabaseにデータがある場合は
  再登録せずSupabase側を正とする

  ======================================== */

  useEffect(() => {
    if (taskMigrationStarted) {
      /*
      React Strict Modeの確認用再実行でも
      通常同期だけは開始できるようにする
      */
      setTaskSyncReady(true)
      return
    }

    taskMigrationStarted = true

    const migrateTasks = async () => {
      try {
        const remoteTasks =
          await fetchTasks()

        const localOnlyTasks =
          tasks.filter(
            (task) =>
              typeof task.id ===
              'number'
          )

        const migrationCompleted =
          localStorage.getItem(
            TASK_MIGRATION_KEY
          ) === 'true'

        /* ========================================

        既にSupabase側にタスクがある場合

        初回移行済みと判断し、
        二重INSERTを行わない

        ======================================== */

        if (remoteTasks.length > 0) {
          setTasks(remoteTasks)
          setTaskSyncReady(true)

          localStorage.setItem(
            TASK_MIGRATION_KEY,
            'true'
          )

          return
        }

        /* ========================================

        既に移行済みで、
        Supabase側が空の場合

        自動で再登録せず処理を止める

        ======================================== */

        if (migrationCompleted) {
          setTasks([])
          setTaskSyncReady(true)
          return
        }

        if (localOnlyTasks.length === 0) {
          setTasks([])
          setTaskSyncReady(true)

          localStorage.setItem(
            TASK_MIGRATION_KEY,
            'true'
          )

          return
        }

        const idMap =
          new Map<TaskId, TaskId>()

        const migratedTasks: Task[] = []

        for (const task of localOnlyTasks) {
          const savedTask =
            await createTask(task)

          idMap.set(
            task.id,
            savedTask.id
          )

          migratedTasks.push(
            savedTask
          )
        }

        setTasks(migratedTasks)
        setTaskSyncReady(true)

        setTaskDayResults(
          (current) =>
            current.map(
              (result) => ({
                ...result,
                taskId:
                  idMap.get(
                    result.taskId
                  ) ??
                  result.taskId,
              })
            )
        )

        localStorage.setItem(
          TASK_MIGRATION_KEY,
          'true'
        )
      } catch (error) {
        taskMigrationStarted = false
        setTaskSyncReady(false)

        console.error(
          'タスクのSupabase移行に失敗しました',
          error
        )
      }
    }

    void migrateTasks()
  }, [])


  /* ========================================

  通常タスクをSupabaseへ同期

  ・新規タスクはUUIDを発行して置換
  ・編集、完了、日時変更も更新
  ・処理は順番に実行して競合を防ぐ

  ======================================== */

  useEffect(() => {
    if (!taskSyncReady) {
      return
    }

    const snapshot = tasks

    taskSyncQueue.current =
      taskSyncQueue.current
        .then(async () => {
          const idMap =
            new Map<TaskId, TaskId>()

          for (const task of snapshot) {
            if (typeof task.id === 'number') {
              const savedTask =
                await createTask(task)

              idMap.set(
                task.id,
                savedTask.id
              )
            } else {
              await updateTask(task)
            }
          }

          if (idMap.size === 0) {
            return
          }

          setTasks(
            (current) =>
              current.map(
                (task) => {
                  const nextId =
                    idMap.get(task.id)

                  return nextId
                    ? {
                        ...task,
                        id: nextId,
                      }
                    : task
                }
              )
          )

          setTaskDayResults(
            (current) =>
              current.map(
                (result) => ({
                  ...result,
                  taskId:
                    idMap.get(
                      result.taskId
                    ) ??
                    result.taskId,
                })
              )
          )
        })
        .catch((error) => {
          console.error(
            'タスクのSupabase同期に失敗しました',
            error
          )
        })
  }, [
    tasks,
    taskSyncReady,
    setTaskDayResults,
    setTasks,
  ])


  /* ========================================

  Supabase タスク日別結果同期

  過去日の「できた / できなかった」を
  Supabaseへ保存する

  ======================================== */

  const [taskDayResultSyncReady, setTaskDayResultSyncReady] =
    useState(false)

  const taskDayResultSyncQueue =
    useRef(Promise.resolve())

  const taskDayResultMigrationStarted =
    useRef(false)

  const taskDayResultKnownKeys =
    useRef<Set<string>>(new Set())

  const getTaskDayResultKey = (
    result: TaskDayResult
  ) =>
    `${result.taskId}:${result.date}`

  useEffect(() => {
    if (!taskSyncReady) {
      return
    }

    if (taskDayResultMigrationStarted.current) {
      return
    }

    taskDayResultMigrationStarted.current = true

    const TASK_DAY_RESULT_MIGRATION_KEY =
      'todo-app-task-day-results-supabase-migrated-v1'

    const migrateTaskDayResults = async () => {
      try {
        const remoteResults =
          await fetchTaskDayResults()

        if (remoteResults.length > 0) {
          taskDayResultKnownKeys.current =
            new Set(
              remoteResults.map(
                getTaskDayResultKey
              )
            )

          setTaskDayResults(remoteResults)
          setTaskDayResultSyncReady(true)

          localStorage.setItem(
            TASK_DAY_RESULT_MIGRATION_KEY,
            'true'
          )

          return
        }

        const localResults =
          taskDayResults.filter(
            (result) =>
              typeof result.taskId === 'string'
          )

        const migratedResults:
          TaskDayResult[] = []

        for (const result of localResults) {
          const savedResult =
            await saveTaskDayResult(result)

          migratedResults.push(
            savedResult
          )
        }

        taskDayResultKnownKeys.current =
          new Set(
            migratedResults.map(
              getTaskDayResultKey
            )
          )

        if (
          migratedResults.length > 0 ||
          taskDayResults.length > 0
        ) {
          setTaskDayResults(migratedResults)
        }

        setTaskDayResultSyncReady(true)

        localStorage.setItem(
          TASK_DAY_RESULT_MIGRATION_KEY,
          'true'
        )
      } catch (error) {
        taskDayResultMigrationStarted.current = false
        setTaskDayResultSyncReady(false)

        console.error(
          'タスク日別結果のSupabase移行に失敗しました',
          error
        )
      }
    }

    void migrateTaskDayResults()
  }, [taskSyncReady])


  /* ========================================

  タスク日別結果をSupabaseへ同期

  追加 / 更新を保存し、
  アプリ側から消えた結果は削除する

  ======================================== */

  useEffect(() => {
    if (!taskDayResultSyncReady) {
      return
    }

    const activeResults =
      taskDayResults.filter(
        (result) =>
          typeof result.taskId === 'string'
      )

    const previousKeys =
      new Set(
        taskDayResultKnownKeys.current
      )

    const nextKeys =
      new Set(
        activeResults.map(
          getTaskDayResultKey
        )
      )

    taskDayResultSyncQueue.current =
      taskDayResultSyncQueue.current
        .then(async () => {
          for (const result of activeResults) {
            await saveTaskDayResult(result)
          }

          for (const key of previousKeys) {
            if (!nextKeys.has(key)) {
              const separatorIndex =
                key.lastIndexOf(':')

              const taskId =
                key.slice(0, separatorIndex)

              const date =
                key.slice(separatorIndex + 1)

              await deleteTaskDayResultFromSupabase(
                taskId,
                date
              )
            }
          }

          taskDayResultKnownKeys.current =
            nextKeys
        })
        .catch((error) => {
          console.error(
            'タスク日別結果のSupabase同期に失敗しました',
            error
          )
        })
  }, [
    taskDayResults,
    taskDayResultSyncReady,
  ])


  /* ========================================

  ルーティン基本設定

  ======================================== */

  const [routines, setRoutines] =
    useStoredState<RoutineItem[]>(
      'todo-app-routines-v2',
      mockRoutines
    )


  /* ========================================

  Supabaseルーティン同期状態

  初回読込が完了するまでは
  自動同期を開始しない

  ======================================== */

  const [routineSyncReady, setRoutineSyncReady] =
    useState(false)

  const routineSyncQueue =
    useRef(Promise.resolve())

  const routineMigrationStarted =
    useRef(false)

  const routineKnownIds =
    useRef<Set<number>>(
      new Set()
    )


  /* ========================================

  localStorage → Supabase
  初回ルーティン移行

  Supabase側に既存データがある場合は
  そちらを正として読み込む

  ======================================== */

  useEffect(() => {
    if (routineMigrationStarted.current) {
      return
    }

    routineMigrationStarted.current = true

    const ROUTINE_MIGRATION_KEY =
      'todo-app-routines-supabase-migrated-v1'

    const migrateRoutines = async () => {
      try {
        const remoteRoutines =
          await fetchRoutines()

        /* ========================================

        既にSupabase側にある場合

        Supabase側を正として読み込む

        ======================================== */

        if (remoteRoutines.length > 0) {
          routineKnownIds.current =
            new Set(
              remoteRoutines.map(
                (routine) =>
                  routine.id
              )
            )

          setRoutines(remoteRoutines)
          setRoutineSyncReady(true)

          localStorage.setItem(
            ROUTINE_MIGRATION_KEY,
            'true'
          )

          return
        }

        /* ========================================

        Supabase側が空の場合

        localStorageにルーティンが残っていれば
        移行済みフラグの有無に関係なく再登録する

        テーブルを作り直した場合でも
        ローカルデータを失わないための処理

        ======================================== */

        if (routines.length === 0) {
          routineKnownIds.current =
            new Set()

          setRoutineSyncReady(true)

          localStorage.setItem(
            ROUTINE_MIGRATION_KEY,
            'true'
          )

          return
        }

        /* ========================================

        初回移行

        現在のlocalStorageのルーティンを
        同じ数値idのままSupabaseへ保存する

        ======================================== */

        const migratedRoutines:
          RoutineItem[] = []

        for (const routine of routines) {
          const savedRoutine =
            await saveRoutine(routine)

          migratedRoutines.push(
            savedRoutine
          )
        }

        routineKnownIds.current =
          new Set(
            migratedRoutines.map(
              (routine) =>
                routine.id
            )
          )

        setRoutines(migratedRoutines)
        setRoutineSyncReady(true)

        localStorage.setItem(
          ROUTINE_MIGRATION_KEY,
          'true'
        )
      } catch (error) {
        routineMigrationStarted.current = false
        setRoutineSyncReady(false)

        console.error(
          'ルーティンのSupabase移行に失敗しました',
          error
        )
      }
    }

    void migrateRoutines()
  }, [])


  /* ========================================

  ルーティンをSupabaseへ同期

  ・追加 / 編集 / 並び替えを保存
  ・削除されたidはSupabaseから削除
  ・処理は順番に実行して競合を防ぐ

  ======================================== */

  useEffect(() => {
    if (!routineSyncReady) {
      return
    }

    const snapshot = routines

    const previousIds =
      new Set(
        routineKnownIds.current
      )

    const nextIds =
      new Set(
        snapshot.map(
          (routine) => routine.id
        )
      )

    routineSyncQueue.current =
      routineSyncQueue.current
        .then(async () => {
          for (const routine of snapshot) {
            await saveRoutine(routine)
          }

          for (const routineId of previousIds) {
            if (!nextIds.has(routineId)) {
              await deleteRoutineFromSupabase(
                routineId
              )
            }
          }

          routineKnownIds.current =
            nextIds
        })
        .catch((error) => {
          console.error(
            'ルーティンのSupabase同期に失敗しました',
            error
          )
        })
  }, [
    routines,
    routineSyncReady,
  ])


  /* ========================================

  日別ルーティン時刻変更

  ======================================== */

  const [routineOverrides, setRoutineOverrides] =
    useStoredState<RoutineTimeOverride[]>(
      'todo-app-routine-overrides-v1',
      []
    )


  /* ========================================

  Supabase 日別ルーティン時刻同期

  Supabase側に既存データがある場合は
  そちらを正として読み込む

  ======================================== */

  const [routineOverrideSyncReady, setRoutineOverrideSyncReady] =
    useState(false)

  const routineOverrideSyncQueue =
    useRef(Promise.resolve())

  const routineOverrideMigrationStarted =
    useRef(false)

  const routineOverrideKnownKeys =
    useRef<Set<string>>(new Set())

  const getRoutineOverrideKey = (
    override: RoutineTimeOverride
  ) =>
    `${override.routineId}:${override.date}`

  useEffect(() => {
    if (routineOverrideMigrationStarted.current) {
      return
    }

    routineOverrideMigrationStarted.current = true

    const ROUTINE_OVERRIDE_MIGRATION_KEY =
      'todo-app-routine-overrides-supabase-migrated-v1'

    const migrateRoutineOverrides = async () => {
      try {
        const remoteOverrides =
          await fetchRoutineOverrides()

        if (remoteOverrides.length > 0) {
          routineOverrideKnownKeys.current =
            new Set(
              remoteOverrides.map(
                getRoutineOverrideKey
              )
            )

          setRoutineOverrides(remoteOverrides)
          setRoutineOverrideSyncReady(true)

          localStorage.setItem(
            ROUTINE_OVERRIDE_MIGRATION_KEY,
            'true'
          )

          return
        }

        if (routineOverrides.length === 0) {
          routineOverrideKnownKeys.current =
            new Set()

          setRoutineOverrideSyncReady(true)

          localStorage.setItem(
            ROUTINE_OVERRIDE_MIGRATION_KEY,
            'true'
          )

          return
        }

        const migratedOverrides:
          RoutineTimeOverride[] = []

        for (const override of routineOverrides) {
          const savedOverride =
            await saveRoutineOverride(override)

          migratedOverrides.push(
            savedOverride
          )
        }

        routineOverrideKnownKeys.current =
          new Set(
            migratedOverrides.map(
              getRoutineOverrideKey
            )
          )

        setRoutineOverrides(
          migratedOverrides
        )
        setRoutineOverrideSyncReady(true)

        localStorage.setItem(
          ROUTINE_OVERRIDE_MIGRATION_KEY,
          'true'
        )
      } catch (error) {
        routineOverrideMigrationStarted.current = false
        setRoutineOverrideSyncReady(false)

        console.error(
          '日別ルーティン時刻のSupabase移行に失敗しました',
          error
        )
      }
    }

    void migrateRoutineOverrides()
  }, [])


  /* ========================================

  日別ルーティン時刻をSupabaseへ同期

  ======================================== */

  useEffect(() => {
    if (!routineOverrideSyncReady) {
      return
    }

    const snapshot = routineOverrides

    const previousKeys =
      new Set(
        routineOverrideKnownKeys.current
      )

    const nextKeys =
      new Set(
        snapshot.map(
          getRoutineOverrideKey
        )
      )

    routineOverrideSyncQueue.current =
      routineOverrideSyncQueue.current
        .then(async () => {
          for (const override of snapshot) {
            await saveRoutineOverride(override)
          }

          for (const key of previousKeys) {
            if (!nextKeys.has(key)) {
              const separatorIndex =
                key.indexOf(':')

              const routineId = Number(
                key.slice(0, separatorIndex)
              )

              const date =
                key.slice(separatorIndex + 1)

              await deleteRoutineOverrideFromSupabase(
                routineId,
                date
              )
            }
          }

          routineOverrideKnownKeys.current =
            nextKeys
        })
        .catch((error) => {
          console.error(
            '日別ルーティン時刻のSupabase同期に失敗しました',
            error
          )
        })
  }, [
    routineOverrides,
    routineOverrideSyncReady,
  ])


  /* ========================================

  日別ルーティン結果

  ======================================== */

  const [routineStates, setRoutineStates] =
    useStoredState<RoutineDayState[]>(
      'todo-app-routine-states-v1',
      []
    )


  /* ========================================

  Supabase 日別ルーティン結果同期

  completed / skipped のどちらでもない状態は
  Supabaseには保存しない

  ======================================== */

  const [routineStateSyncReady, setRoutineStateSyncReady] =
    useState(false)

  const routineStateSyncQueue =
    useRef(Promise.resolve())

  const routineStateMigrationStarted =
    useRef(false)

  const routineStateKnownKeys =
    useRef<Set<string>>(new Set())

  const getRoutineStateKey = (
    state: RoutineDayState
  ) =>
    `${state.routineId}:${state.date}`

  const isStoredRoutineState = (
    state: RoutineDayState
  ) =>
    state.completed || state.skipped

  useEffect(() => {
    if (!routineSyncReady) {
      return
    }

    if (routineStateMigrationStarted.current) {
      return
    }

    routineStateMigrationStarted.current = true

    const ROUTINE_STATE_MIGRATION_KEY =
      'todo-app-routine-states-supabase-migrated-v1'

    const migrateRoutineStates = async () => {
      try {
        const remoteStates =
          await fetchRoutineStates()

        if (remoteStates.length > 0) {
          routineStateKnownKeys.current =
            new Set(
              remoteStates.map(
                getRoutineStateKey
              )
            )

          setRoutineStates(remoteStates)
          setRoutineStateSyncReady(true)

          localStorage.setItem(
            ROUTINE_STATE_MIGRATION_KEY,
            'true'
          )

          return
        }

        const localStates =
          routineStates.filter(
            isStoredRoutineState
          )

        if (localStates.length === 0) {
          routineStateKnownKeys.current =
            new Set()

          if (routineStates.length > 0) {
            setRoutineStates([])
          }

          setRoutineStateSyncReady(true)

          localStorage.setItem(
            ROUTINE_STATE_MIGRATION_KEY,
            'true'
          )

          return
        }

        const migratedStates:
          RoutineDayState[] = []

        for (const state of localStates) {
          const savedState =
            await saveRoutineState(state)

          migratedStates.push(
            savedState
          )
        }

        routineStateKnownKeys.current =
          new Set(
            migratedStates.map(
              getRoutineStateKey
            )
          )

        setRoutineStates(migratedStates)
        setRoutineStateSyncReady(true)

        localStorage.setItem(
          ROUTINE_STATE_MIGRATION_KEY,
          'true'
        )
      } catch (error) {
        routineStateMigrationStarted.current = false
        setRoutineStateSyncReady(false)

        console.error(
          '日別ルーティン結果のSupabase移行に失敗しました',
          error
        )
      }
    }

    void migrateRoutineStates()
  }, [routineSyncReady])


  /* ========================================

  日別ルーティン結果をSupabaseへ同期

  完了 / 今日やらないを保存し、
  解除された状態はSupabaseから削除する

  ======================================== */

  useEffect(() => {
    if (!routineStateSyncReady) {
      return
    }

    const activeStates =
      routineStates.filter(
        isStoredRoutineState
      )

    const previousKeys =
      new Set(
        routineStateKnownKeys.current
      )

    const nextKeys =
      new Set(
        activeStates.map(
          getRoutineStateKey
        )
      )

    routineStateSyncQueue.current =
      routineStateSyncQueue.current
        .then(async () => {
          for (const state of activeStates) {
            await saveRoutineState(state)
          }

          for (const key of previousKeys) {
            if (!nextKeys.has(key)) {
              const separatorIndex =
                key.indexOf(':')

              const routineId = Number(
                key.slice(0, separatorIndex)
              )

              const date =
                key.slice(separatorIndex + 1)

              await deleteRoutineStateFromSupabase(
                routineId,
                date
              )
            }
          }

          routineStateKnownKeys.current =
            nextKeys
        })
        .catch((error) => {
          console.error(
            '日別ルーティン結果のSupabase同期に失敗しました',
            error
          )
        })
  }, [
    routineStates,
    routineStateSyncReady,
  ])


  /* ========================================

  起床時刻・振り返り

  ======================================== */

  const [lifeLogs, setLifeLogs] =
    useStoredState<DailyLifeLog[]>(
      'todo-app-life-logs-v1',
      []
    )


  /* ========================================

  Supabase 生活記録同期

  既存localStorageの生活記録を初回移行し、
  以後は追加 / 更新 / 削除を同期する

  ======================================== */

  const [lifeLogSyncReady, setLifeLogSyncReady] =
    useState(false)

  const lifeLogSyncQueue =
    useRef(Promise.resolve())

  const lifeLogMigrationStarted =
    useRef(false)

  const lifeLogKnownDates =
    useRef<Set<string>>(new Set())

  useEffect(() => {
    if (lifeLogMigrationStarted.current) {
      return
    }

    lifeLogMigrationStarted.current = true

    const LIFE_LOG_MIGRATION_KEY =
      'todo-app-life-logs-supabase-migrated-v1'

    const migrateLifeLogs = async () => {
      try {
        const remoteLogs =
          await fetchLifeLogs()

        if (remoteLogs.length > 0) {
          lifeLogKnownDates.current =
            new Set(
              remoteLogs.map(
                (log) => log.date
              )
            )

          setLifeLogs(remoteLogs)
          setLifeLogSyncReady(true)

          localStorage.setItem(
            LIFE_LOG_MIGRATION_KEY,
            'true'
          )

          return
        }

        const migratedLogs:
          DailyLifeLog[] = []

        for (const log of lifeLogs) {
          const savedLog =
            await saveLifeLog(log)

          migratedLogs.push(savedLog)
        }

        lifeLogKnownDates.current =
          new Set(
            migratedLogs.map(
              (log) => log.date
            )
          )

        if (migratedLogs.length > 0) {
          setLifeLogs(migratedLogs)
        }

        setLifeLogSyncReady(true)

        localStorage.setItem(
          LIFE_LOG_MIGRATION_KEY,
          'true'
        )
      } catch (error) {
        lifeLogMigrationStarted.current = false
        setLifeLogSyncReady(false)

        console.error(
          '生活記録のSupabase移行に失敗しました',
          error
        )
      }
    }

    void migrateLifeLogs()
  }, [])


  /* ========================================

  生活記録をSupabaseへ同期

  ======================================== */

  useEffect(() => {
    if (!lifeLogSyncReady) {
      return
    }

    const snapshot =
      lifeLogs.map(
        (log) => ({ ...log })
      )

    const previousDates =
      new Set(lifeLogKnownDates.current)

    const nextDates =
      new Set(
        snapshot.map(
          (log) => log.date
        )
      )

    lifeLogSyncQueue.current =
      lifeLogSyncQueue.current
        .then(async () => {
          for (const log of snapshot) {
            await saveLifeLog(log)
          }

          for (const date of previousDates) {
            if (!nextDates.has(date)) {
              await deleteLifeLogFromSupabase(
                date
              )
            }
          }

          lifeLogKnownDates.current =
            nextDates
        })
        .catch((error) => {
          console.error(
            '生活記録のSupabase同期に失敗しました',
            error
          )
        })
  }, [
    lifeLogs,
    lifeLogSyncReady,
  ])


  /* ========================================

  タスクモーダル

  ======================================== */

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [editingTaskId, setEditingTaskId] =
    useState<TaskId | null>(null)


  /* ========================================

  明日の予定調整モーダル

  ======================================== */

  const [isTomorrowModalOpen, setIsTomorrowModalOpen] =
    useState(false)


  /* ========================================

  タスク入力フォーム

  ======================================== */

  const [title, setTitle] =
    useState('')

  const [taskDate, setTaskDate] =
    useState(selectedDate)

  const [durationMinutes, setDurationMinutes] =
    useState(60)

  const [priority, setPriority] =
    useState<Priority>('中')

  const [hasDeadline, setHasDeadline] =
    useState(true)

  const [dueDate, setDueDate] =
    useState('')

  const [startTime, setStartTime] =
    useState('')

  const [endTime, setEndTime] =
    useState('')

  const [memo, setMemo] =
    useState('')


  /* ========================================

  現在時刻を1分ごとに更新

  ======================================== */

  useEffect(() => {
    const timer =
      setInterval(() => {
        setNow(
          new Date()
        )
      }, 60000)

    return () =>
      clearInterval(timer)
  }, [])


  /* ========================================

  未完了タスクの翌日自動繰越

  過去日の未完了タスクを
  アプリを開いた日に移動する

  時刻は解除して
  今日のToDoへ戻す

  元の期限は変更しない

  ======================================== */

  useEffect(() => {
    const overdueTasks =
      tasks.filter(
        (task) =>
          !task.completed &&
          isDateBefore(
            task.taskDate,
            todayDate
          )
      )

    if (overdueTasks.length === 0) {
      return
    }

    setTaskDayResults(
      (current) => {
        const next = [...current]

        overdueTasks.forEach(
          (task) => {
            const existingIndex =
              next.findIndex(
                (result) =>
                  result.date === task.taskDate &&
                  result.taskId === task.id
              )

            const result:
              TaskDayResult = {
              date: task.taskDate,
              taskId: task.id,
              title: task.title,
              completed: false,
            }

            if (existingIndex >= 0) {
              next[existingIndex] = result
            } else {
              next.push(result)
            }
          }
        )

        return next
      }
    )

    setTasks(
      (current) =>
        current.map(
          (task) =>
            !task.completed &&
            isDateBefore(
              task.taskDate,
              todayDate
            )
              ? {
                  ...task,
                  taskDate: todayDate,
                  startHour: null,
                  startMinute: null,
                  endHour: null,
                  endMinute: null,
                }
              : task
        )
    )
  }, [
    todayDate,
    setTaskDayResults,
    setTasks,
  ])


  /* ========================================

  タスクフォーム初期化

  ======================================== */

  const resetForm = () => {
    setTitle('')
    setTaskDate(selectedDate)
    setDurationMinutes(60)
    setPriority('中')
    setHasDeadline(true)
    setDueDate('')
    setStartTime('')
    setEndTime('')
    setMemo('')
    setEditingTaskId(null)
  }


  /* ========================================

  新規タスク

  ======================================== */

  /* ========================================

  Todayから新規タスク

  現在開いている日を
  実行日の初期値にする

  ======================================== */

  const openNewTaskModal = () => {
    resetForm()
    setTaskDate(selectedDate)
    setIsModalOpen(true)
  }


  /* ========================================

  タスク管理から新規タスク

  今日を
  実行日の初期値にする

  ======================================== */

  const openNewTaskModalForToday = () => {
    resetForm()
    setTaskDate(todayDate)
    setIsModalOpen(true)
  }


  /* ========================================

  タスク編集

  ======================================== */

  const openEditTaskModal = (
    task: Task
  ) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setTaskDate(task.taskDate)
    setDurationMinutes(
      task.durationMinutes
    )
    setPriority(task.priority)
    setHasDeadline(
      task.dueDate !== null
    )
    setDueDate(
      task.dueDate ?? ''
    )

    if (
      task.startHour !== null &&
      task.startMinute !== null
    ) {
      setStartTime(
        formatTime(
          task.startHour,
          task.startMinute
        )
      )
    } else {
      setStartTime('')
    }

    if (
      task.endHour !== null &&
      task.endMinute !== null
    ) {
      setEndTime(
        formatTime(
          task.endHour,
          task.endMinute
        )
      )
    } else {
      setEndTime('')
    }

    setMemo(task.memo)
    setIsModalOpen(true)
  }


  const closeTaskModal = () => {
    setIsModalOpen(false)
    resetForm()
  }


  /* ========================================

  開始時刻変更

  ======================================== */

  const handleStartTimeChange = (
    value: string
  ) => {
    setStartTime(value)

    if (!value) {
      setEndTime('')
      return
    }

    const startMinutes =
      timeStringToMinutes(value)

    if (startMinutes === null) {
      return
    }

    setEndTime(
      minutesToTimeString(
        startMinutes +
        durationMinutes
      )
    )
  }


  /* ========================================

  予定時間変更

  ======================================== */

  const handleDurationChange = (
    value: number
  ) => {
    setDurationMinutes(value)

    if (!startTime) {
      return
    }

    const startMinutes =
      timeStringToMinutes(
        startTime
      )

    if (startMinutes === null) {
      return
    }

    setEndTime(
      minutesToTimeString(
        startMinutes + value
      )
    )
  }


  /* ========================================

  終了時刻変更

  ======================================== */

  const handleEndTimeChange = (
    value: string
  ) => {
    setEndTime(value)

    if (
      !startTime ||
      !value
    ) {
      return
    }

    const startMinutes =
      timeStringToMinutes(
        startTime
      )

    const finishMinutes =
      timeStringToMinutes(value)

    if (
      startMinutes === null ||
      finishMinutes === null ||
      finishMinutes <= startMinutes
    ) {
      return
    }

    setDurationMinutes(
      finishMinutes -
      startMinutes
    )
  }


  /* ========================================

  フォームからTaskを作成

  実行日と期限を分けて登録

  ======================================== */

  const buildTaskFromForm = (
    existingTask?: Task
  ): Task | null => {
    if (!title.trim()) {
      alert(
        'タスク名を入力してください'
      )
      return null
    }

    if (!taskDate) {
      alert(
        'いつ行うかを入力してください'
      )
      return null
    }

    if (
      hasDeadline &&
      !dueDate
    ) {
      alert(
        '期限を入力するか「期限なし」を選択してください'
      )
      return null
    }

    if (durationMinutes <= 0) {
      alert(
        '予定時間を入力してください'
      )
      return null
    }

    let taskStartHour:
      number | null = null

    let taskStartMinute:
      number | null = null

    let taskEndHour:
      number | null = null

    let taskEndMinute:
      number | null = null

    if (startTime) {
      const startMinutes =
        timeStringToMinutes(
          startTime
        )

      const finishMinutes =
        timeStringToMinutes(
          endTime
        )

      if (
        startMinutes === null ||
        finishMinutes === null
      ) {
        alert(
          '開始・終了時刻を確認してください'
        )
        return null
      }

      if (
        finishMinutes <=
        startMinutes
      ) {
        alert(
          '終了時刻は開始時刻より後にしてください'
        )
        return null
      }

      taskStartHour =
        Math.floor(
          startMinutes / 60
        )

      taskStartMinute =
        startMinutes % 60

      taskEndHour =
        Math.floor(
          finishMinutes / 60
        )

      taskEndMinute =
        finishMinutes % 60
    }

    return {
      id:
        existingTask?.id ??
        Date.now(),
      title: title.trim(),
      durationMinutes,
      priority,
      dueDate:
        hasDeadline
          ? dueDate
          : null,
      taskDate,
      startHour: taskStartHour,
      startMinute: taskStartMinute,
      endHour: taskEndHour,
      endMinute: taskEndMinute,
      memo: memo.trim(),
      completed:
        existingTask?.completed ??
        false,
      completedDate:
        existingTask?.completedDate ??
        null,
    }
  }


  /* ========================================

  タスク保存

  ======================================== */

  const saveTask = () => {
    if (editingTaskId === null) {
      const newTask =
        buildTaskFromForm()

      if (!newTask) {
        return
      }

      setTasks(
        (current) => [
          ...current,
          newTask,
        ]
      )
    } else {
      const existingTask =
        tasks.find(
          (task) =>
            task.id ===
            editingTaskId
        )

      if (!existingTask) {
        return
      }

      const updatedTask =
        buildTaskFromForm(
          existingTask
        )

      if (!updatedTask) {
        return
      }

      setTasks(
        (current) =>
          current.map(
            (task) =>
              task.id ===
              editingTaskId
                ? updatedTask
                : task
          )
      )
    }

    closeTaskModal()
  }


  /* ========================================

  タスク削除

  ======================================== */

  const deleteTask = () => {
    if (editingTaskId === null) {
      return
    }

    const confirmed =
      window.confirm(
        'このタスクを削除しますか？'
      )

    if (!confirmed) {
      return
    }

    const deletedTaskId =
      editingTaskId

    setTasks(
      (current) =>
        current.filter(
          (task) =>
            task.id !==
            deletedTaskId
        )
    )

    if (
      typeof deletedTaskId ===
      'string'
    ) {
      taskSyncQueue.current =
        taskSyncQueue.current
          .then(() =>
            deleteTaskFromSupabase(
              deletedTaskId
            )
          )
          .catch((error) => {
            console.error(
              'タスクのSupabase削除に失敗しました',
              error
            )
          })
    }

    closeTaskModal()
  }

/* ========================================

タイムライン上で
タスクの開始時刻を変更

ドラッグ終了位置は
5分刻みで受け取る

所要時間は変更せず
終了時刻を自動計算する

======================================== */

const moveTaskOnTimeline = (
  taskId: TaskId,
  startMinutes: number
) => {
  setTasks(
    (current) =>
      current.map(
        (task) => {
          if (
            task.id !== taskId
          ) {
            return task
          }

          const endMinutes =
            startMinutes +
            task.durationMinutes

          return {
            ...task,

            startHour:
              Math.floor(
                startMinutes / 60
              ),

            startMinute:
              startMinutes % 60,

            endHour:
              Math.floor(
                endMinutes / 60
              ),

            endMinute:
              endMinutes % 60,
          }
        }
      )
  )
}


  /* ========================================

  タスクを時刻未設定へ戻す

  タイムラインから右ToDoへ
  ドロップしたときに使用

  ======================================== */

  const unscheduleTask = (
    taskId: TaskId
  ) => {
    setTasks(
      (current) =>
        current.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
                  startHour: null,
                  startMinute: null,
                  endHour: null,
                  endMinute: null,
                }
              : task
        )
    )
  }


  /* ========================================

  今日だけルーティン時刻を変更

  基本時刻は変更せず
  日別overrideとして保存

  ======================================== */

  const moveRoutineOnTimeline = (
    routineId: number,
    startMinutes: number,
    targetDate: string = selectedDate
  ) => {
    const scheduledTime =
      minutesToTimeString(
        startMinutes
      )

    const routine =
      routines.find(
        (item) =>
          item.id === routineId
      )

    if (!routine) {
      return
    }

    setRoutineOverrides(
      (current) => {
        const withoutTarget =
          current.filter(
            (override) =>
              !(
                override.date ===
                  targetDate &&
                override.routineId ===
                  routineId
              )
          )

        if (
          scheduledTime ===
          routine.defaultTime
        ) {
          return withoutTarget
        }

        return [
          ...withoutTarget,
          {
            routineId,
            date: targetDate,
            scheduledTime,
          },
        ]
      }
    )
  }

  /* ========================================

  タスク完了 / 未完了

  結果だけ記録する

  ======================================== */

  const toggleTaskComplete = (
    taskId: TaskId
  ) => {
    const target =
      tasks.find(
        (task) =>
          task.id === taskId
      )

    if (!target) {
      return
    }

    const nextCompleted =
      !target.completed

    setTasks(
      (current) =>
        current.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
                  completed:
                    nextCompleted,
                  completedDate:
                    nextCompleted
                      ? todayDate
                      : null,
                }
              : task
        )
    )

    setTaskDayResults(
      (current) => {
        const next =
          current.filter(
            (result) =>
              !(
                result.date ===
                  target.taskDate &&
                result.taskId ===
                  target.id
              )
          )

        return [
          ...next,
          {
            date: target.taskDate,
            taskId: target.id,
            title: target.title,
            completed:
              nextCompleted,
          },
        ]
      }
    )
  }


  /* ========================================

  タスクを明日へ移動

  時刻は一旦解除して
  明日のToDoへ入れる

  ======================================== */

  const moveTaskToTomorrow = (
    taskId: TaskId
  ) => {
    setTasks(
      (current) =>
        current.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
                  taskDate:
                    tomorrowDate,
                  startHour: null,
                  startMinute: null,
                  endHour: null,
                  endMinute: null,
                }
              : task
        )
    )
  }


  /* ========================================

  日別ルーティン時刻を保存

  基本時刻と同じものは
  overrideとして保存しない

  ======================================== */

  const saveRoutineTimesForDate = (
    date: string,
    times:
      Record<number, string | null>
  ) => {
    setRoutineOverrides(
      (current) => {
        const withoutDate =
          current.filter(
            (override) =>
              override.date !== date
          )

        const additions:
          RoutineTimeOverride[] = []

        routines.forEach(
          (routine) => {
            const selected =
              times[routine.id] ?? null

            if (
              selected !==
              routine.defaultTime
            ) {
              additions.push({
                routineId: routine.id,
                date,
                scheduledTime:
                  selected,
              })
            }
          }
        )

        return [
          ...withoutDate,
          ...additions,
        ]
      }
    )
  }


  /* ========================================

  ルーティン完了 / 未完了

  ======================================== */

  const toggleRoutineComplete = (
    routineId: number,
    targetDate: string = selectedDate
  ) => {
    setRoutineStates(
      (current) => {
        const existing =
          current.find(
            (state) =>
              state.date === targetDate &&
              state.routineId ===
                routineId
          )

        if (existing?.skipped) {
          return current
        }

        if (!existing) {
          return [
            ...current,
            {
              date: targetDate,
              routineId,
              completed: true,
              skipped: false,
            },
          ]
        }

        return current.map(
          (state) =>
            state.date === targetDate &&
            state.routineId === routineId
              ? {
                  ...state,
                  completed:
                    !state.completed,
                }
              : state
        )
      }
    )
  }


  /* ========================================

  今日やらない / 戻す

  「今日やらない」の場合は
  分母からも外す

  ======================================== */

  const toggleRoutineSkip = (
    routineId: number,
    targetDate: string = selectedDate
  ) => {
    setRoutineStates(
      (current) => {
        const existing =
          current.find(
            (state) =>
              state.date === targetDate &&
              state.routineId ===
                routineId
          )

        if (!existing) {
          return [
            ...current,
            {
              date: targetDate,
              routineId,
              completed: false,
              skipped: true,
            },
          ]
        }

        return current.map(
          (state) =>
            state.date === targetDate &&
            state.routineId === routineId
              ? {
                  ...state,
                  completed: false,
                  skipped:
                    !state.skipped,
                }
              : state
        )
      }
    )
  }


  /* ========================================

  生活記録更新

  ======================================== */

  const updateLifeLog = (
    targetDate: string,
    changes:
      Partial<
        Omit<DailyLifeLog, 'date'>
      >
  ) => {
    setLifeLogs(
      (current) => {
        const existing =
          current.find(
            (log) =>
              log.date === targetDate
          )

        if (!existing) {
          return [
            ...current,
            {
              date: targetDate,
              wakeUpTime: null,
              reflection: '',
              ...changes,
            },
          ]
        }

        return current.map(
          (log) =>
            log.date === targetDate
              ? {
                  ...log,
                  ...changes,
                }
              : log
        )
      }
    )
  }


  /* ========================================

  Google Calendar

  認証トークンと取得済み予定を
  ページ間で共有する

  ======================================== */

  const [
    googleCalendarAccessToken,
    setGoogleCalendarAccessToken,
  ] =
    useState<string | null>(
      null
    )

  const [
    googleCalendarEvents,
    setGoogleCalendarEvents,
  ] =
    useState<GoogleCalendarEvent[]>(
      []
    )


  /* ========================================

  ページ表示

  ======================================== */

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'today':
        return (
          <TodayPage
            tasks={tasks}
            now={now}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            routines={routines}
            routineOverrides={
              routineOverrides
            }
            routineStates={
              routineStates
            }
            taskDayResults={
              taskDayResults
            }
            lifeLogs={lifeLogs}
            googleCalendarEvents={
              googleCalendarEvents
            }
            onAddTask={
              openNewTaskModal
            }
            onToggleComplete={
              toggleTaskComplete
            }
            onEditTask={
              openEditTaskModal
            }
            onMoveTask={
              moveTaskOnTimeline
            }
            onUnscheduleTask={
              unscheduleTask
            }
            onMoveRoutine={(routineId, startMinutes) =>
              moveRoutineOnTimeline(
                routineId,
                startMinutes,
                selectedDate
              )
            }
            onToggleRoutine={(routineId) =>
              toggleRoutineComplete(
                routineId,
                selectedDate
              )
            }
            onToggleRoutineSkip={(routineId) =>
              toggleRoutineSkip(
                routineId,
                selectedDate
              )
            }
            onWakeUpTimeChange={
              (value) =>
                updateLifeLog(
                  selectedDate,
                  { wakeUpTime: value }
                )
            }
            onReflectionChange={
              (value) =>
                updateLifeLog(
                  selectedDate,
                  { reflection: value }
                )
            }
            onOpenTomorrowAdjust={() =>
              setIsTomorrowModalOpen(
                true
              )
            }
          />
        )

      case 'calendar':
        return <CalendarPage />

      case 'tasks':
        return (
          <TasksPage
  tasks={tasks}
  now={now}
  onAddTask={
    openNewTaskModalForToday
  }
  onEditTask={
    openEditTaskModal
  }
  onToggleComplete={
    toggleTaskComplete
  }
  onOpenDate={(
    date
  ) => {
    setSelectedDate(
      date
    )

    setCurrentPage(
      'today'
    )
  }}
/>
        )

      case 'routine':
        return (
          <RoutinePage
            routines={routines}
            onRoutinesChange={
              setRoutines
            }
            onOpenTomorrowAdjust={() =>
              setIsTomorrowModalOpen(
                true
              )
            }
          />
        )

      case 'googleCalendar':
        return (
          <GoogleCalendarPage
            accessToken={
              googleCalendarAccessToken
            }
            events={
              googleCalendarEvents
            }
            onAccessTokenChange={
              setGoogleCalendarAccessToken
            }
            onEventsChange={
              setGoogleCalendarEvents
            }
          />
        )

      case 'settings':
        return <SettingsPage />

      default:
        return null
    }
  }


  return (
    <div className="app">
      <Sidebar
        currentPage={currentPage}
        onPageChange={
          setCurrentPage
        }
      />

      <div className="app-content">
        {renderCurrentPage()}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        editingTaskId={
          editingTaskId
        }
        title={title}
        taskDate={taskDate}
        durationMinutes={
          durationMinutes
        }
        priority={priority}
        hasDeadline={hasDeadline}
        dueDate={dueDate}
        startTime={startTime}
        endTime={endTime}
        memo={memo}
        setTitle={setTitle}
        setTaskDate={setTaskDate}
        setPriority={setPriority}
        setHasDeadline={
          setHasDeadline
        }
        setDueDate={setDueDate}
        setMemo={setMemo}
        onDurationChange={
          handleDurationChange
        }
        onStartTimeChange={
          handleStartTimeChange
        }
        onEndTimeChange={
          handleEndTimeChange
        }
        onClose={closeTaskModal}
        onSave={saveTask}
        onDelete={deleteTask}
      />

      <TomorrowRoutineModal
        isOpen={
          isTomorrowModalOpen
        }
        date={tomorrowDate}
        todayDate={todayDate}
        routines={routines}
        overrides={routineOverrides}
        tasks={tasks}
        onClose={() =>
          setIsTomorrowModalOpen(
            false
          )
        }
        onSaveTimes={
          saveRoutineTimesForDate
        }
        onMoveTaskToTomorrow={
          moveTaskToTomorrow
        }
      />
    </div>
  )
}


/* ========================================

Supabase認証

・ログイン状態を確認
・ログイン状態を維持
・ログアウトを管理

======================================== */

function App() {
  const [session, setSession] =
    useState<Session | null>(null)

  const [isAuthLoading, setIsAuthLoading] =
    useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const {
        data,
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      setSession(
        data.session
      )

      setIsAuthLoading(
        false
      )
    }

    void loadSession()

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(
          nextSession
        )

        setIsAuthLoading(
          false
        )
      }
    )

    return () => {
      isMounted = false

      authListener.subscription.unsubscribe()
    }
  }, [])


  const handleLogout = async () => {
    await supabase.auth.signOut()
  }


  if (isAuthLoading) {
    return (
      <div className="auth-loading-page">
        <div className="auth-loading-card">
          読み込み中...
        </div>
      </div>
    )
  }


  if (!session) {
    return <LoginPage />
  }


  return (
    <>
      <TodoApp />

      <button
        type="button"
        className="app-logout-button"
        onClick={() => {
          void handleLogout()
        }}
      >
        ログアウト
      </button>
    </>
  )
}

export default App
