/* ========================================

Google Calendarとの通信処理

・Google Identity Servicesの読み込み
・Googleアカウントの認証
・カレンダー一覧取得
・予定取得

======================================== */

const GOOGLE_IDENTITY_SCRIPT_URL =
  'https://accounts.google.com/gsi/client'

const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly'

const GOOGLE_CALENDAR_API_BASE =
  'https://www.googleapis.com/calendar/v3'


/* ========================================

Google APIで使用する型

======================================== */

type GoogleTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type GoogleTokenClient = {
  requestAccessToken: (
    options?: {
      prompt?: string
    }
  ) => void
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
          initTokenClient: (
            config: {
              client_id: string
              scope: string
              callback: (
                response: GoogleTokenResponse
              ) => void
              error_callback?: (
                error: unknown
              ) => void
            }
          ) => GoogleTokenClient
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

Google Calendarの読み取り権限を取得

======================================== */

export async function requestGoogleCalendarAccessToken() {
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
      const tokenClient =
        oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_CALENDAR_SCOPE,

          callback: (
            response
          ) => {
            if (
              response.error ||
              !response.access_token
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
              response.access_token
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

      tokenClient.requestAccessToken({
        prompt: '',
      })
    }
  )
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
