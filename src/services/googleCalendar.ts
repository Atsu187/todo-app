/* ========================================

Google Calendarとの通信処理

・Google Identity Servicesの読み込み
・Authorization Codeの取得
・Supabase Edge Functionとの認証連携
・カレンダー一覧取得
・予定取得

======================================== */

import {
  supabase,
} from './supabase'


const GOOGLE_IDENTITY_SCRIPT_URL =
  'https://accounts.google.com/gsi/client'

const GOOGLE_CALENDAR_SCOPE =
  [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  ].join(' ')

const GOOGLE_CALENDAR_API_BASE =
  'https://www.googleapis.com/calendar/v3'

const GOOGLE_AUTH_FUNCTION =
  'google-calendar-auth'


/* ========================================

Google APIで使用する型

======================================== */

type GoogleCodeResponse = {
  code?: string
  error?: string
  error_description?: string
}

type GoogleCodeClient = {
  requestCode: () => void
}

type GoogleCalendarAuthResponse = {
  connected?: boolean
  accessToken?: string
  expiresIn?: number
  error?: string
}

type GoogleCalendarListEntry = {
  id: string
  summary?: string
  primary?: boolean
  selected?: boolean
  hidden?: boolean
}

type GoogleCalendarListResponse = {
  items?: GoogleCalendarListEntry[]
}

type GoogleEventDateTime = {
  date?: string
  dateTime?: string
}

type GoogleCalendarApiEvent = {
  id: string
  summary?: string
  start?: GoogleEventDateTime
  end?: GoogleEventDateTime
  htmlLink?: string
  status?: string
}

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarApiEvent[]
  nextPageToken?: string
}


/* ========================================

アプリ内で使用する予定データ

======================================== */

export type GoogleCalendarEvent = {
  id: string
  calendarId: string
  calendarName: string
  title: string
  start: string
  end: string
  allDay: boolean
  htmlLink: string | null
}


declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (
            config: {
              client_id: string
              scope: string
              ux_mode: 'popup'
              prompt?: string
              callback: (
                response: GoogleCodeResponse
              ) => void
              error_callback?: (
                error: unknown
              ) => void
            }
          ) => GoogleCodeClient
          revoke: (
            token: string,
            done?: () => void
          ) => void
        }
      }
    }
  }
}


let googleIdentityScriptPromise:
  Promise<void> | null = null


/* ========================================

Google Identity Servicesを読み込む

======================================== */

function loadGoogleIdentityScript() {
  if (
    window.google?.accounts?.oauth2
  ) {
    return Promise.resolve()
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise
  }

  googleIdentityScriptPromise =
    new Promise<void>(
      (resolve, reject) => {
        const existingScript =
          document.querySelector<HTMLScriptElement>(
            `script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`
          )

        if (existingScript) {
          existingScript.addEventListener(
            'load',
            () => resolve(),
            { once: true }
          )

          existingScript.addEventListener(
            'error',
            () => reject(
              new Error(
                'Googleの認証ライブラリを読み込めませんでした。'
              )
            ),
            { once: true }
          )

          return
        }

        const script =
          document.createElement(
            'script'
          )

        script.src =
          GOOGLE_IDENTITY_SCRIPT_URL
        script.async = true
        script.defer = true

        script.onload = () => {
          resolve()
        }

        script.onerror = () => {
          googleIdentityScriptPromise = null

          reject(
            new Error(
              'Googleの認証ライブラリを読み込めませんでした。'
            )
          )
        }

        document.head.appendChild(
          script
        )
      }
    )

  return googleIdentityScriptPromise
}


/* ========================================

GoogleからAuthorization Codeを取得

初回接続時のみユーザー操作が必要

======================================== */

export async function requestGoogleCalendarAuthorizationCode() {
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId) {
    throw new Error(
      'VITE_GOOGLE_CLIENT_IDが設定されていません。'
    )
  }

  await loadGoogleIdentityScript()

  const oauth2 =
    window.google?.accounts?.oauth2

  if (!oauth2) {
    throw new Error(
      'Googleの認証機能を初期化できませんでした。'
    )
  }

  return new Promise<string>(
    (resolve, reject) => {
      const codeClient =
        oauth2.initCodeClient({
          client_id: clientId,
          scope: GOOGLE_CALENDAR_SCOPE,
          ux_mode: 'popup',
          prompt: 'consent',

          callback: (
            response
          ) => {
            if (
              response.error ||
              !response.code
            ) {
              reject(
                new Error(
                  response.error_description ||
                  response.error ||
                  'Google Calendarへの接続に失敗しました。'
                )
              )

              return
            }

            resolve(
              response.code
            )
          },

          error_callback: () => {
            reject(
              new Error(
                'Googleの認証画面を開けませんでした。'
              )
            )
          },
        })

      codeClient.requestCode()
    }
  )
}


/* ========================================

Edge Function共通呼び出し

======================================== */

async function invokeGoogleCalendarAuth(
  body: Record<string, unknown>
) {
  const {
    data,
    error,
  } = await supabase.functions.invoke<GoogleCalendarAuthResponse>(
    GOOGLE_AUTH_FUNCTION,
    {
      body,
      headers: {
        'X-Requested-With':
          'XmlHttpRequest',
      },
    }
  )

  if (error) {
    throw new Error(
      error.message ||
      'Google Calendarの認証処理に失敗しました。'
    )
  }

  if (data?.error) {
    throw new Error(
      data.error
    )
  }

  return data
}


/* ========================================

初回Authorization Codeを交換

Refresh TokenはEdge Function側で保存

======================================== */

export async function exchangeGoogleCalendarAuthorizationCode(
  code: string
) {
  const data =
    await invokeGoogleCalendarAuth({
      action: 'exchange',
      code,
      origin: window.location.origin,
    })

  if (!data?.accessToken) {
    throw new Error(
      'Googleのアクセストークンを取得できませんでした。'
    )
  }

  return data.accessToken
}


/* ========================================

保存済みRefresh Tokenから自動再接続

======================================== */

export async function refreshGoogleCalendarAccessToken() {
  const data =
    await invokeGoogleCalendarAuth({
      action: 'refresh',
    })

  if (
    data?.connected === false ||
    !data?.accessToken
  ) {
    return null
  }

  return data.accessToken
}


/* ========================================

現在のAccess Tokenに
Google Calendar書き込み権限があるか確認

古いRefresh Tokenが読み取り専用のままの場合を
判別するために使用する

======================================== */

export async function hasGoogleCalendarWriteAccess(
  accessToken: string
) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  )

  if (!response.ok) {
    return false
  }

  const data =
    await response.json() as {
      scope?: string
    }

  const scopes =
    new Set(
      (data.scope ?? '')
        .split(' ')
        .filter(Boolean)
    )

  return (
    scopes.has(
      'https://www.googleapis.com/auth/calendar.events'
    ) ||
    scopes.has(
      'https://www.googleapis.com/auth/calendar'
    )
  )
}


/* ========================================

保存済みGoogle接続情報を削除

======================================== */

export async function disconnectStoredGoogleCalendar() {
  await invokeGoogleCalendarAuth({
    action: 'disconnect',
  })
}


/* ========================================

Google Calendar API共通リクエスト

======================================== */

async function googleCalendarFetch<T>(
  path: string,
  accessToken: string
) {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}${path}`,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        'Google Calendarの認証期限が切れたか、権限がありません。もう一度接続してください。'
      )
    }

    throw new Error(
      `Google Calendar APIでエラーが発生しました。（${response.status}）`
    )
  }

  return response.json() as Promise<T>
}


/* ========================================

表示対象のカレンダー一覧を取得

Google Calendar上で選択されている
カレンダーを優先して取得する

======================================== */

async function fetchCalendarList(
  accessToken: string
) {
  const data =
    await googleCalendarFetch<GoogleCalendarListResponse>(
      '/users/me/calendarList?showHidden=false&maxResults=250',
      accessToken
    )

  const calendars =
    (data.items ?? [])
      .filter(
        (calendar) =>
          !calendar.hidden &&
          (
            calendar.selected === true ||
            calendar.primary === true
          )
      )

  if (calendars.length > 0) {
    return calendars
  }

  return (data.items ?? [])
    .filter(
      (calendar) =>
        !calendar.hidden
    )
}


/* ========================================

1つのカレンダーから予定を取得

======================================== */

async function fetchEventsFromCalendar(
  calendar: GoogleCalendarListEntry,
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const events:
    GoogleCalendarApiEvent[] = []

  let pageToken:
    string | undefined

  do {
    const params =
      new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        showDeleted: 'false',
        maxResults: '2500',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
      })

    if (pageToken) {
      params.set(
        'pageToken',
        pageToken
      )
    }

    const calendarId =
      encodeURIComponent(
        calendar.id
      )

    const data =
      await googleCalendarFetch<GoogleCalendarEventsResponse>(
        `/calendars/${calendarId}/events?${params.toString()}`,
        accessToken
      )

    events.push(
      ...(data.items ?? [])
    )

    pageToken =
      data.nextPageToken
  } while (pageToken)

  return events
    .filter(
      (event) =>
        event.status !== 'cancelled' &&
        event.start &&
        event.end
    )
    .map<GoogleCalendarEvent>(
      (event) => {
        const allDay =
          Boolean(
            event.start?.date
          )

        return {
          id:
            `${calendar.id}:${event.id}`,
          calendarId:
            calendar.id,
          calendarName:
            calendar.summary ||
            'Google Calendar',
          title:
            event.summary ||
            '（タイトルなし）',
          start:
            event.start?.dateTime ||
            event.start?.date ||
            '',
          end:
            event.end?.dateTime ||
            event.end?.date ||
            '',
          allDay,
          htmlLink:
            event.htmlLink ?? null,
        }
      }
    )
}


/* ========================================

Google Calendarの予定をまとめて取得

======================================== */

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const calendars =
    await fetchCalendarList(
      accessToken
    )

  const eventGroups =
    await Promise.all(
      calendars.map(
        (calendar) =>
          fetchEventsFromCalendar(
            calendar,
            accessToken,
            startDate,
            endDate
          )
      )
    )

  return eventGroups
    .flat()
    .sort(
      (first, second) =>
        first.start.localeCompare(
          second.start
        )
    )
}


/* ========================================

Googleとの接続を解除

======================================== */

export function revokeGoogleCalendarAccess(
  accessToken: string
) {
  const oauth2 =
    window.google?.accounts?.oauth2

  if (!oauth2) {
    return
  }

  oauth2.revoke(
    accessToken
  )
}


/* ========================================

TaskをGoogle Calendarへ書き込む

メインカレンダー primary を使用する

======================================== */

type GoogleWritableEventResponse = {
  id: string
  htmlLink?: string
}

const googleCalendarWriteFetch = async <T>(
  path: string,
  accessToken: string,
  init: RequestInit
): Promise<T | null> => {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}${path}`,
    {
      ...init,
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        'Content-Type':
          'application/json',
        ...(init.headers ?? {}),
      },
    }
  )

  if (!response.ok) {
    const details =
      await response.text()

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        'Google Calendarへの書き込み権限がありません。接続解除後、もう一度接続してください。'
      )
    }

    throw new Error(
      `Google Calendarへの書き込みに失敗しました。（${response.status}）${details ? ` ${details}` : ''}`
    )
  }

  if (response.status === 204) {
    return null
  }

  return response.json() as Promise<T>
}

export const createGoogleCalendarTaskEvent = async ({
  accessToken,
  taskId,
  title,
  memo,
  taskDate,
  startHour,
  startMinute,
  durationMinutes,
}: {
  accessToken: string
  taskId: string
  title: string
  memo: string
  taskDate: string
  startHour: number
  startMinute: number
  durationMinutes: number
}) => {
  const start =
    new Date(
      `${taskDate}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`
    )

  const end = new Date(start)
  end.setMinutes(
    end.getMinutes() + durationMinutes
  )

  const data =
    await googleCalendarWriteFetch<GoogleWritableEventResponse>(
      '/calendars/primary/events',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          summary: title,
          description:
            memo || 'My ToDoから同期',
          start: {
            dateTime: start.toISOString(),
          },
          end: {
            dateTime: end.toISOString(),
          },
          extendedProperties: {
            private: {
              todoTaskId: taskId,
            },
          },
        }),
      }
    )

  if (!data?.id) {
    throw new Error(
      'Google Calendar予定のIDを取得できませんでした。'
    )
  }

  return {
    eventId: data.id,
    calendarId: 'primary',
  }
}

export const updateGoogleCalendarTaskEvent = async ({
  accessToken,
  calendarId,
  eventId,
  title,
  memo,
  taskDate,
  startHour,
  startMinute,
  durationMinutes,
}: {
  accessToken: string
  calendarId: string
  eventId: string
  title: string
  memo: string
  taskDate: string
  startHour: number
  startMinute: number
  durationMinutes: number
}) => {
  const start =
    new Date(
      `${taskDate}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`
    )

  const end = new Date(start)
  end.setMinutes(
    end.getMinutes() + durationMinutes
  )

  await googleCalendarWriteFetch<GoogleWritableEventResponse>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify({
        summary: title,
        description:
          memo || 'My ToDoから同期',
        start: {
          dateTime: start.toISOString(),
        },
        end: {
          dateTime: end.toISOString(),
        },
      }),
    }
  )
}

export const deleteGoogleCalendarTaskEvent = async ({
  accessToken,
  calendarId,
  eventId,
}: {
  accessToken: string
  calendarId: string
  eventId: string
}) => {
  await googleCalendarWriteFetch<never>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    {
      method: 'DELETE',
    }
  )
}
