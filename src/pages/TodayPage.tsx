/* ========================================

Today画面全体

上部
・タイムライン
・今日のToDo

中部
・今日の進捗
・起床時刻
・今日のルーティン
・1日の振り返り

下部
・生活 / 活動カレンダー

======================================== */

import type {
  Task,
  TaskDayResult,
} from '../types/task'

import type {
  DailyLifeLog,
  RoutineDayState,
  RoutineItem,
  RoutineTimeOverride,
} from '../types/routine'

import Timeline from '../components/Timeline'
import TodoPanel from '../components/TodoPanel'
import TodayRoutine from '../components/TodayRoutine'
import ActivityCalendar from '../components/ActivityCalendar'

import {
  addDaysToDateKey,
  dateKeyToDate,
  formatTodayTitle,
  getLocalDateKey,
} from '../utils/date'

import {
  timeStringToMinutes,
} from '../utils/time'


type Props = {
  tasks: Task[]

  now: Date

  selectedDate: string

  onDateChange:
    (date: string) => void

  routines: RoutineItem[]

  routineOverrides:
    RoutineTimeOverride[]

  routineStates:
    RoutineDayState[]

  taskDayResults:
    TaskDayResult[]

  lifeLogs:
    DailyLifeLog[]

  onAddTask: () => void

  onToggleComplete:
    (taskId: number) => void

  onEditTask:
    (task: Task) => void

  onMoveTask:
    (
      taskId: number,
      startMinutes: number
    ) => void

  onUnscheduleTask:
    (taskId: number) => void

  onMoveRoutine:
    (
      routineId: number,
      startMinutes: number
    ) => void

  onToggleRoutine:
    (routineId: number) => void

  onToggleRoutineSkip:
    (routineId: number) => void

  onWakeUpTimeChange:
    (value: string | null) => void

  onReflectionChange:
    (value: string) => void

  onOpenTomorrowAdjust:
    () => void
}


function TodayPage({
  tasks,
  now,
  selectedDate,
  onDateChange,
  routines,
  routineOverrides,
  routineStates,
  taskDayResults,
  lifeLogs,
  onAddTask,
  onToggleComplete,
  onEditTask,
  onMoveTask,
  onUnscheduleTask,
  onMoveRoutine,
  onToggleRoutine,
  onToggleRoutineSkip,
  onWakeUpTimeChange,
  onReflectionChange,
  onOpenTomorrowAdjust,
}: Props) {

  const todayDate =
    getLocalDateKey(now)

  const viewedDate =
    selectedDate

  const viewedDateObject =
    dateKeyToDate(viewedDate)

  const isToday =
    viewedDate === todayDate


  const openDateFromCalendar = (
    date: string
  ) => {
    onDateChange(date)

    requestAnimationFrame(() => {
      document
        .querySelector('.today-page')
        ?.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
    })
  }

  const todayLog =
    lifeLogs.find(
      (log) =>
        log.date ===
        viewedDate
    )

  const todayTasks =
    tasks.filter(
      (task) =>
        task.taskDate ===
        viewedDate
    )

  const completedTasks =
    todayTasks.filter(
      (task) =>
        task.completed
    ).length

  const activeRoutines =
    routines.filter(
      (routine) =>
        !routineStates.find(
          (state) =>
            state.date ===
              viewedDate &&
            state.routineId ===
              routine.id
        )?.skipped
    )

  const completedRoutines =
    activeRoutines.filter(
      (routine) =>
        routineStates.find(
          (state) =>
            state.date ===
              viewedDate &&
            state.routineId ===
              routine.id
        )?.completed
    ).length

  const totalDone =
    completedTasks +
    completedRoutines

  const totalItems =
    todayTasks.length +
    activeRoutines.length

  const progress =
    totalItems === 0
      ? 0
      : Math.round(
          (
            totalDone /
            totalItems
          ) *
            100
        )


  /* ========================================

  現在時刻を起床時刻として記録

  ======================================== */

  const setWakeUpTimeAndAlignMorning = (
    value: string | null
  ) => {
    onWakeUpTimeChange(value)

    if (!value) {
      return
    }

    const wakeUpMinutes =
      timeStringToMinutes(value)

    if (wakeUpMinutes === null) {
      return
    }

    const morningRoutines =
      [...routines]
        .filter(
          (routine) =>
            routine.type === 'morning' &&
            routine.defaultTime !== null
        )
        .sort(
          (first, second) =>
            first.order - second.order
        )

    const firstMorningRoutine =
      morningRoutines[0]

    if (!firstMorningRoutine?.defaultTime) {
      return
    }

    const baseStartMinutes =
      timeStringToMinutes(
        firstMorningRoutine.defaultTime
      )

    if (baseStartMinutes === null) {
      return
    }

    const shiftMinutes =
      wakeUpMinutes - baseStartMinutes

    morningRoutines.forEach(
      (routine) => {
        if (!routine.defaultTime) {
          return
        }

        const defaultMinutes =
          timeStringToMinutes(
            routine.defaultTime
          )

        if (defaultMinutes === null) {
          return
        }

        onMoveRoutine(
          routine.id,
          Math.max(
            0,
            Math.min(
              23 * 60 + 59,
              defaultMinutes +
                shiftMinutes
            )
          )
        )
      }
    )
  }


  /* ========================================

  現在時刻を起床時刻として記録

  ======================================== */

  const recordWakeUpNow = () => {
    const value =
      `${String(
        now.getHours()
      ).padStart(
        2,
        '0'
      )}:${String(
        now.getMinutes()
      ).padStart(
        2,
        '0'
      )}`

    setWakeUpTimeAndAlignMorning(
      value
    )
  }


  return (
    <div className="today-page">

      <div className="today-top">

        <main className="timeline">

          <header className="timeline-header">

            <div>

              <p className="eyebrow">
                Today
              </p>

              <div className="date-navigation">
                <button
                  type="button"
                  className="date-nav-button"
                  onClick={() =>
                    onDateChange(
                      addDaysToDateKey(
                        viewedDate,
                        -1
                      )
                    )
                  }
                >
                  ＜
                </button>

                <h1>
                  {formatTodayTitle(
                    viewedDateObject
                  )}
                </h1>

                <button
                  type="button"
                  className="date-nav-button"
                  onClick={() =>
                    onDateChange(
                      addDaysToDateKey(
                        viewedDate,
                        1
                      )
                    )
                  }
                >
                  ＞
                </button>

                {!isToday && (
                  <button
                    type="button"
                    className="today-return-button"
                    onClick={() =>
                      onDateChange(
                        getLocalDateKey(now)
                      )
                    }
                  >
                    今日へ戻る
                  </button>
                )}
              </div>

            </div>

            <div className="today-header-actions">

              {isToday && (
                <button
                  type="button"
                  className="secondary-action-button header-square-action"
                  onClick={recordWakeUpNow}
                >
                  起床
                </button>
              )}

              <button
                type="button"
                className="secondary-action-button header-square-action"
                onClick={
                  onOpenTomorrowAdjust
                }
              >
                明日の予定を調整
              </button>

              <button
                type="button"
                className="add-button"
                onClick={onAddTask}
              >
                ＋ タスクを追加
              </button>

            </div>

          </header>


          {/* ========================================

          タイムライン

          ======================================== */}

          <Timeline
            tasks={tasks}
            now={now}
            date={viewedDate}
            routines={routines}
            routineOverrides={
              routineOverrides
            }
            routineStates={
              routineStates
            }
            onToggleComplete={
              onToggleComplete
            }
            onEditTask={
              onEditTask
            }
            onMoveTask={
              onMoveTask
            }
            onUnscheduleTask={
              onUnscheduleTask
            }
            onMoveRoutine={
              onMoveRoutine
            }
            onToggleRoutine={
              onToggleRoutine
            }
            onToggleRoutineSkip={
              onToggleRoutineSkip
            }
          />

        </main>


        {/* ========================================

        今日のToDo

        ======================================== */}

        <TodoPanel
          date={viewedDate}
          tasks={tasks}
          routines={routines}
          routineOverrides={
            routineOverrides
          }
          routineStates={
            routineStates
          }
          onToggleComplete={
            onToggleComplete
          }
          onEditTask={
            onEditTask
          }
          onToggleRoutine={
            onToggleRoutine
          }
          onToggleRoutineSkip={
            onToggleRoutineSkip
          }
        />

      </div>


      {/* ========================================

      今日の進捗・生活記録

      ======================================== */}

      <section className="today-dashboard-section">

        <div className="today-progress-card">

          <p className="eyebrow">
            Progress
          </p>

          <h2>
            今日の進捗
          </h2>

          <div className="today-progress-value">

            <strong>
              {progress}%
            </strong>

            <span>
              {totalDone}
              {' / '}
              {totalItems}
            </span>

          </div>

          <div className="today-progress-bar">

            <span
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

          <div className="today-progress-breakdown">

            <span>
              ルーティン
              {' '}
              {completedRoutines}
              /
              {activeRoutines.length}
            </span>

            <span>
              Task
              {' '}
              {completedTasks}
              /
              {todayTasks.length}
            </span>

          </div>

        </div>


        <div className="wake-up-card">

          <p className="eyebrow">
            Wake Up
          </p>

          <h2>
            起床時刻
          </h2>

          <div className="wake-up-controls">

            <input
              type="time"
              value={
                todayLog?.wakeUpTime ??
                ''
              }
              onChange={(
                event
              ) =>
                setWakeUpTimeAndAlignMorning(
                  event.target.value ||
                    null
                )
              }
            />

            <button
              type="button"
              className="secondary-action-button"
              onClick={
                recordWakeUpNow
              }
            >
              今の時刻を記録
            </button>

          </div>

        </div>

      </section>


      {/* ========================================

      今日のルーティン

      ======================================== */}

      <TodayRoutine
        date={viewedDate}
        routines={routines}
        overrides={
          routineOverrides
        }
        states={
          routineStates
        }
        onToggleComplete={
          onToggleRoutine
        }
        onToggleSkip={
          onToggleRoutineSkip
        }
      />


      {/* ========================================

      1日の振り返り

      ======================================== */}

      <section className="reflection-section">

        <div className="reflection-header">

          <div>

            <p className="eyebrow">
              Review
            </p>

            <h2>
              1日の振り返り
            </h2>

          </div>

          <span>
            自動保存
          </span>

        </div>

        <textarea
          value={
            todayLog?.reflection ??
            ''
          }
          onChange={(
            event
          ) =>
            onReflectionChange(
              event.target.value
            )
          }
          placeholder="今日できたこと、気づいたこと、明日に活かしたいことを簡単に記録"
          rows={4}
        />

      </section>


      {/* ========================================

      活動カレンダー

      ======================================== */}

      <ActivityCalendar
        currentDate={now}
        routines={routines}
        routineStates={
          routineStates
        }
        tasks={tasks}
        taskDayResults={
          taskDayResults
        }
        lifeLogs={lifeLogs}
        onDateSelect={
          openDateFromCalendar
        }
      />

    </div>
  )
}


export default TodayPage