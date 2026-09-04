/* ========================================

Today画面下部の活動カレンダー

表示するもの
・起床時刻
・朝ルーティン ○/○
・夜ルーティン ○/○
・Task ○/○

======================================== */

import {
  useState,
} from 'react'

import type {
  Task,
  TaskDayResult,
} from '../types/task'

import type {
  DailyLifeLog,
  RoutineDayState,
  RoutineItem,
} from '../types/routine'

import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getLocalDateKey,
} from '../utils/date'

import ActivityRecordModal from './ActivityRecordModal'


type Props = {
  currentDate: Date

  routines: RoutineItem[]

  routineStates: RoutineDayState[]

  tasks: Task[]

  taskDayResults: TaskDayResult[]

  lifeLogs: DailyLifeLog[]

  onDateSelect?:
    (date: string) => void
}


function ActivityCalendar({
  currentDate,
  routines,
  routineStates,
  tasks,
  taskDayResults,
  lifeLogs,
  onDateSelect,
}: Props) {
  const [displayedDate, setDisplayedDate] =
    useState(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
    )

  const [selectedDate, setSelectedDate] =
    useState<string | null>(
      null
    )

  const year =
    displayedDate.getFullYear()

  const month =
    displayedDate.getMonth()

  const daysInMonth =
    getDaysInMonth(
      year,
      month
    )

  const firstDay =
    getFirstDayOfMonth(
      year,
      month
    )

  const todayKey =
    getLocalDateKey(
      currentDate
    )

  const weekdays = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
  ]


  /* ========================================

  日ごとの集計

  ======================================== */

  const getSummary = (
    date: string
  ) => {
    const lifeLog =
      lifeLogs.find(
        (log) =>
          log.date === date
      )

    const getRoutineCount = (
      type: 'morning' | 'evening'
    ) => {
      const group =
        routines.filter(
          (routine) =>
            routine.type === type
        )

      const active =
        group.filter(
          (routine) =>
            !routineStates.find(
              (state) =>
                state.date === date &&
                state.routineId ===
                  routine.id
            )?.skipped
        )

      const completed =
        active.filter(
          (routine) =>
            routineStates.find(
              (state) =>
                state.date === date &&
                state.routineId ===
                  routine.id
            )?.completed
        ).length

      return {
        completed,
        total: active.length,
      }
    }

    const recorded =
      taskDayResults.filter(
        (result) =>
          result.date === date
      )

    const currentTasks =
      tasks.filter(
        (task) =>
          task.taskDate === date
      )

    const taskCompleted =
      recorded.length > 0
        ? recorded.filter(
            (result) =>
              result.completed
          ).length
        : currentTasks.filter(
            (task) =>
              task.completed
          ).length

    const taskTotal =
      recorded.length > 0
        ? recorded.length
        : currentTasks.length

    return {
      wakeUpTime:
        lifeLog?.wakeUpTime ?? null,
      morning:
        getRoutineCount(
          'morning'
        ),
      evening:
        getRoutineCount(
          'evening'
        ),
      tasks: {
        completed: taskCompleted,
        total: taskTotal,
      },
    }
  }


  /* ========================================

  月移動

  ======================================== */

  const moveMonth = (
    amount: number
  ) => {
    setDisplayedDate(
      new Date(
        year,
        month + amount,
        1
      )
    )
  }


  const cells:
    Array<number | null> = [
    ...Array.from(
      {
        length: firstDay,
      },
      () => null
    ),
    ...Array.from(
      {
        length: daysInMonth,
      },
      (_, index) =>
        index + 1
    ),
  ]

  while (
    cells.length % 7 !== 0
  ) {
    cells.push(null)
  }


  return (
    <section className="achievement-section">
      <div className="activity-calendar-header">
        <div>
          <p className="eyebrow">
            Activity
          </p>

          <h2>
            生活・活動記録
          </h2>
        </div>

        <div className="activity-calendar-navigation">
          <button
            type="button"
            className="month-navigation-button"
            onClick={() =>
              moveMonth(-1)
            }
          >
            ‹
          </button>

          <strong className="activity-calendar-month">
            {year}年{month + 1}月
          </strong>

          <button
            type="button"
            className="month-navigation-button"
            onClick={() =>
              moveMonth(1)
            }
          >
            ›
          </button>

          <button
            type="button"
            className="current-month-button"
            onClick={() =>
              setDisplayedDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  1
                )
              )
            }
          >
            今月へ
          </button>
        </div>
      </div>

      <div className="achievement-calendar">
        {weekdays.map(
          (weekday) => (
            <div
              key={weekday}
              className="achievement-weekday"
            >
              {weekday}
            </div>
          )
        )}

        {cells.map(
          (day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="achievement-day empty"
                />
              )
            }

            const date =
              `${year}-${String(
                month + 1
              ).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`

            const summary =
              getSummary(date)

            const hasRecord =
              Boolean(
                summary.wakeUpTime ||
                summary.morning.completed ||
                summary.evening.completed ||
                summary.tasks.total ||
                lifeLogs.find(
                  (log) =>
                    log.date === date &&
                    log.reflection.trim()
                )
              )

            return (
              <button
                type="button"
                key={date}
                className={[
                  'achievement-day',
                  'activity-calendar-day',
                  hasRecord
                    ? 'has-record'
                    : '',
                  date === todayKey
                    ? 'today'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (
                    date >= todayKey &&
                    onDateSelect
                  ) {
                    onDateSelect(date)
                    return
                  }

                  setSelectedDate(date)
                }}
              >
                <span className="achievement-day-number">
                  {day}
                </span>

                <div className="activity-summary">
                  <div className="activity-summary-row wake">
                    <span>起床</span>
                    <strong>
                      {summary.wakeUpTime ?? '—'}
                    </strong>
                  </div>

                  <div className="activity-summary-row">
                    <span>朝</span>
                    <strong>
                      {summary.morning.completed}
                      /
                      {summary.morning.total}
                    </strong>
                  </div>

                  <div className="activity-summary-row">
                    <span>夜</span>
                    <strong>
                      {summary.evening.completed}
                      /
                      {summary.evening.total}
                    </strong>
                  </div>

                  <div className="activity-summary-row">
                    <span>Task</span>
                    <strong>
                      {summary.tasks.completed}
                      /
                      {summary.tasks.total}
                    </strong>
                  </div>
                </div>
              </button>
            )
          }
        )}
      </div>

      <ActivityRecordModal
        selectedDate={selectedDate}
        routines={routines}
        routineStates={routineStates}
        tasks={tasks}
        taskDayResults={taskDayResults}
        lifeLogs={lifeLogs}
        onClose={() =>
          setSelectedDate(null)
        }
      />
    </section>
  )
}

export default ActivityCalendar
