/* ========================================

Google Calendar
連携・予定確認ページ

======================================== */

import {
  useMemo,
  useState,
} from 'react'

import {
  fetchGoogleCalendarEvents,
  requestGoogleCalendarAccessToken,
  revokeGoogleCalendarAccess,
} from '../services/googleCalendar'

import type {
  GoogleCalendarEvent,
} from '../services/googleCalendar'


/* ========================================

日付表示

======================================== */

function formatEventDate(
  value: string,
  allDay: boolean
) {
  if (allDay) {
    const [
      year,
      month,
      day,
    ] = value
      .split('-')
      .map(Number)

    return `${year}/${month}/${day}`
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date)
}


type Props = {
  accessToken: string | null
  events: GoogleCalendarEvent[]
  onAccessTokenChange:
    (token: string | null) => void
  onEventsChange:
    (events: GoogleCalendarEvent[]) => void
}


/* ========================================

Google Calendarページ

======================================== */

function GoogleCalendarPage({
  accessToken,
  events,
  onAccessTokenChange,
  onEventsChange,
}: Props) {

  const [isLoading, setIsLoading] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')


  /* ========================================

  取得期間

  今日から30日後まで

  ======================================== */

  const dateRange = useMemo(
    () => {
      const startDate =
        new Date()

      startDate.setHours(
        0,
        0,
        0,
        0
      )

      const endDate =
        new Date(startDate)

      endDate.setDate(
        endDate.getDate() + 31
      )

      return {
        startDate,
        endDate,
      }
    },
    []
  )


  /* ========================================

  予定を取得

  ======================================== */

  const loadEvents = async (
    token: string
  ) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const calendarEvents =
        await fetchGoogleCalendarEvents(
          token,
          dateRange.startDate,
          dateRange.endDate
        )

      onEventsChange(
        calendarEvents
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Google Calendarの予定を取得できませんでした。'
      )
    } finally {
      setIsLoading(false)
    }
  }


  /* ========================================

  Google Calendarに接続

  ======================================== */

  const connectGoogleCalendar = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const token =
        await requestGoogleCalendarAccessToken()

      onAccessTokenChange(token)

      await loadEvents(token)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Google Calendarへの接続に失敗しました。'
      )

      setIsLoading(false)
    }
  }


  /* ========================================

  接続解除

  ======================================== */

  const disconnectGoogleCalendar = () => {
    if (accessToken) {
      revokeGoogleCalendarAccess(
        accessToken
      )
    }

    onAccessTokenChange(null)
    onEventsChange([])
    setErrorMessage('')
  }


  return (
    <div className="google-calendar-page">

      <div className="google-calendar-header">
        <div>
          <p className="eyebrow">
            Integration
          </p>

          <h1>
            Google Calendar
          </h1>

          <p className="google-calendar-description">
            Googleカレンダーの予定を読み取り、
            ToDoアプリ内で確認します。
          </p>
        </div>

        <div className="google-calendar-actions">
          {!accessToken ? (
            <button
              type="button"
              className="primary-action-button"
              onClick={
                connectGoogleCalendar
              }
              disabled={isLoading}
            >
              {isLoading
                ? '接続中...'
                : 'Googleカレンダーに接続'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="secondary-action-button"
                onClick={() =>
                  loadEvents(
                    accessToken
                  )
                }
                disabled={isLoading}
              >
                {isLoading
                  ? '更新中...'
                  : '予定を更新'}
              </button>

              <button
                type="button"
                className="secondary-action-button"
                onClick={
                  disconnectGoogleCalendar
                }
              >
                接続を解除
              </button>
            </>
          )}
        </div>
      </div>


      {errorMessage && (
        <div className="google-calendar-error">
          {errorMessage}
        </div>
      )}


      <section className="google-calendar-status-card">
        <div>
          <span className="google-calendar-status-label">
            接続状態
          </span>

          <strong>
            {accessToken
              ? '接続済み'
              : '未接続'}
          </strong>
        </div>

        <div>
          <span className="google-calendar-status-label">
            読み取り範囲
          </span>

          <strong>
            今日から30日先まで
          </strong>
        </div>

        <div>
          <span className="google-calendar-status-label">
            取得予定数
          </span>

          <strong>
            {events.length}件
          </strong>
        </div>
      </section>


      <section className="google-calendar-events-section">
        <div className="google-calendar-section-header">
          <div>
            <p className="eyebrow">
              Upcoming
            </p>

            <h2>
              Googleカレンダーの予定
            </h2>
          </div>
        </div>


        {!accessToken && (
          <div className="google-calendar-empty">
            「Googleカレンダーに接続」を押すと、
            予定を読み込めます。
          </div>
        )}


        {accessToken &&
          !isLoading &&
          events.length === 0 && (
            <div className="google-calendar-empty">
              期間内の予定はありません。
            </div>
          )}


        {events.length > 0 && (
          <div className="google-calendar-event-list">
            {events.map(
              (event) => (
                <article
                  key={event.id}
                  className="google-calendar-event-card"
                >
                  <div className="google-calendar-event-time">
                    {event.allDay
                      ? `${formatEventDate(
                          event.start,
                          true
                        )}・終日`
                      : formatEventDate(
                          event.start,
                          false
                        )}
                  </div>

                  <div className="google-calendar-event-main">
                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {event.calendarName}
                    </p>
                  </div>

                  {event.htmlLink && (
                    <a
                      className="google-calendar-event-link"
                      href={event.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Googleで開く
                    </a>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </section>

    </div>
  )
}

export default GoogleCalendarPage
