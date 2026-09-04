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
  useState,
} from 'react'

import './App.css'

import Sidebar from './components/Sidebar'
import TaskModal from './components/TaskModal'
import TomorrowRoutineModal from './components/TomorrowRoutineModal'

import TodayPage from './pages/TodayPage'
import CalendarPage from './pages/CalendarPage'
import TasksPage from './pages/TasksPage'
import RoutinePage from './pages/RoutinePage'
import GoogleCalendarPage from './pages/GoogleCalendarPage'
import SettingsPage from './pages/SettingsPage'

import type {
  Priority,
  Task,
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


function App() {
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

  タスクの日別結果

  ======================================== */

  const [taskDayResults, setTaskDayResults] =
    useStoredState<TaskDayResult[]>(
      'todo-app-task-day-results-v1',
      []
    )


  /* ========================================

  ルーティン基本設定

  ======================================== */

  const [routines, setRoutines] =
    useStoredState<RoutineItem[]>(
      'todo-app-routines-v2',
      mockRoutines
    )


  /* ========================================

  日別ルーティン時刻変更

  ======================================== */

  const [routineOverrides, setRoutineOverrides] =
    useStoredState<RoutineTimeOverride[]>(
      'todo-app-routine-overrides-v1',
      []
    )


  /* ========================================

  日別ルーティン結果

  ======================================== */

  const [routineStates, setRoutineStates] =
    useStoredState<RoutineDayState[]>(
      'todo-app-routine-states-v1',
      []
    )


  /* ========================================

  起床時刻・振り返り

  ======================================== */

  const [lifeLogs, setLifeLogs] =
    useStoredState<DailyLifeLog[]>(
      'todo-app-life-logs-v1',
      []
    )


  /* ========================================

  タスクモーダル

  ======================================== */

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [editingTaskId, setEditingTaskId] =
    useState<number | null>(null)


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

    setTasks(
      (current) =>
        current.filter(
          (task) =>
            task.id !==
            editingTaskId
        )
    )

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
  taskId: number,
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
    taskId: number
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
    taskId: number
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
    taskId: number
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
          <GoogleCalendarPage />
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

export default App
