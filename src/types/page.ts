/* ========================================

アプリ内のページ種類

today
→ 今日の画面

calendar
→ カレンダー

tasks
→ タスク管理

routine
→ ルーティン設定

googleCalendar
→ Google Calendar連携

settings
→ 設定

======================================== */

export type AppPage =
  | 'today'
  | 'calendar'
  | 'tasks'
  | 'routine'
  | 'googleCalendar'
  | 'settings'