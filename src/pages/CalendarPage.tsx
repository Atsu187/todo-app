/* ========================================

統合月間カレンダー

新しいカレンダー用データは保存せず、
既存データから表示を組み立てる

表示
・Google Calendar予定
・実行日が設定されたTask
・期限日
・Taskの完了数

日付をクリックするとTodayへ移動

======================================== */

import {
  useEffect,
  useState,
} from 'react'

import type {
  Task,
} from '../types/task'

import {
  fetchGoogleCalendarEvents,
  refreshGoogleCalendarAccessToken,
} from '../services/googleCalendar'

import type {
  GoogleCalendarEvent,
} from '../services/googleCalendar'

import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getLocalDateKey,
} from '../utils/date'


type Props = {
  currentDate: Date

  tasks: Task[]

  onDateSelect:
    (date: string) => void
}


function CalendarPage({
  currentDate,
  tasks,
  onDateSelect,
}: Props) {
  const [
    displayedDate,
    setDisplayedDate,
  ] =
    useState(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
    )

  const [
    googleEvents,
    setGoogleEvents,
  ] =
    useState<GoogleCalendarEvent[]>(
      []
    )

  const [
    isGoogleLoading,
    setIsGoogleLoading,
  ] =
    useState(false)

  const [
    googleCalendarConnected,
    setGoogleCalendarConnected,
  ] =
    useState(true)

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

  表示月のGoogle予定を取得

  カレンダー用データは保存しない

  ======================================== */

  useEffect(() => {
    let isCancelled = false

    const loadGoogleEvents = async () => {
      setIsGoogleLoading(true)

      try {
        const accessToken =
          await refreshGoogleCalendarAccessToken()

        if (isCancelled) {
          return
        }

        if (!accessToken) {
          setGoogleCalendarConnected(
            false
          )

          setGoogleEvents([])

          return
        }

        setGoogleCalendarConnected(
          true
        )

        const startDate =
          new Date(
            year,
            month,
            1
          )

        const endDate =
          new Date(
            year,
            month + 1,
            1
          )

        const events =
          await fetchGoogleCalendarEvents(
            accessToken,
            startDate,
            endDate
          )

        if (isCancelled) {
          return
        }

        setGoogleEvents(
          events
        )
      } catch (error) {
        console.error(
          '月間カレンダーのGoogle予定取得に失敗しました',
          error
        )

        if (!isCancelled) {
          setGoogleEvents([])
        }
      } finally {
        if (!isCancelled) {
          setIsGoogleLoading(
            false
          )
        }
      }
    }

    void loadGoogleEvents()

    return () => {
      isCancelled = true
    }
  }, [
    year,
    month,
  ])


  /* ========================================

  Google予定が指定日に含まれるか

  終日予定・日またぎ予定にも対応

  ======================================== */

  const isGoogleEventOnDate = (
    event: GoogleCalendarEvent,
    date: string
  ) => {
    if (event.allDay) {
      return (
        event.start <= date &&
        date < event.end
      )
    }

    const dayStart =
      new Date(
        `${date}T00:00:00`
      )

    const dayEnd =
      new Date(dayStart)

    dayEnd.setDate(
      dayEnd.getDate() + 1
    )

    const eventStart =
      new Date(event.start)

    const eventEnd =
      new Date(event.end)

    return (
      eventStart < dayEnd &&
      eventEnd > dayStart
    )
  }


  /* ========================================

  日ごとの予定集計

  ======================================== */

  const getSummary = (
    date: string
  ) => {
    const dateTasks =
      tasks.filter(
        (task) =>
          task.taskDate === date
      )

    const completedTasks =
      dateTasks.filter(
        (task) =>
          task.completed
      ).length

    const dueTasks =
      tasks.filter(
        (task) =>
          task.dueDate === date &&
          !task.completed
      )

    const dateGoogleEvents =
      googleEvents.filter(
        (event) =>
          isGoogleEventOnDate(
            event,
            date
          )
      )

    return {
      google:
        dateGoogleEvents.length,

      tasks: {
        completed:
          completedTasks,

        total:
          dateTasks.length,
      },

      deadlines:
        dueTasks.length,
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


  /* ========================================

  カレンダーセル

  ======================================== */

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
    <div className="calendar-page">
      <section className="achievement-section calendar-overview-section">

        <div className="activity-calendar-header">
          <div>
            <p className="eyebrow">
              Calendar
            </p>

            <h2>
              予定カレンダー
            </h2>

            <p className="calendar-page-description">
              Task・期限・Google Calendarを
              まとめて確認します。
            </p>
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


        <div className="calendar-status-row">

          <span>
            Google：
            {
              isGoogleLoading
                ? '読込中'
                : googleCalendarConnected
                  ? '連携済み'
                  : '未接続'
            }
          </span>

          <span>
            ※ カレンダー専用データは保存しません
          </span>

        </div>


        <div className="calendar-month-scroll">
          <div className="achievement-calendar calendar-overview-grid">

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
              (
                day,
                index
              ) => {
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
                  ).padStart(
                    2,
                    '0'
                  )}-${String(
                    day
                  ).padStart(
                    2,
                    '0'
                  )}`

                const summary =
                  getSummary(
                    date
                  )

                const hasSchedule =
                  (
                    summary.google >
                    0
                  ) ||
                  (
                    summary.tasks.total >
                    0
                  ) ||
                  (
                    summary.deadlines >
                    0
                  )

                return (
                  <button
                    type="button"
                    key={date}
                    className={[
                      'achievement-day',
                      'activity-calendar-day',
                      'calendar-overview-day',
                      hasSchedule
                        ? 'has-record'
                        : '',
                      date === todayKey
                        ? 'today'
                        : '',
                    ]
                      .filter(
                        Boolean
                      )
                      .join(' ')}
                    onClick={() =>
                      onDateSelect(
                        date
                      )
                    }
                  >

                    <span className="achievement-day-number">
                      {day}
                    </span>


                    <div className="activity-summary calendar-overview-summary">

                      <div className="activity-summary-row google">
                        <span>
                          Google
                        </span>

                        <strong>
                          {
                            summary.google
                          }件
                        </strong>
                      </div>


                      <div className="activity-summary-row">
                        <span>
                          Task
                        </span>

                        <strong>
                          {
                            summary.tasks.completed
                          }
                          /
                          {
                            summary.tasks.total
                          }
                        </strong>
                      </div>


                      <div className="activity-summary-row deadline">
                        <span>
                          期限
                        </span>

                        <strong>
                          {
                            summary.deadlines
                          }件
                        </strong>
                      </div>

                    </div>

                  </button>
                )
              }
            )}

          </div>
        </div>


        <p className="achievement-help">
          日付をクリックすると、
          その日のTodayを開きます。
        </p>

      </section>
    </div>
  )
}

export default CalendarPage
