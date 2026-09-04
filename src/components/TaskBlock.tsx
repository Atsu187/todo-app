/* ========================================

タイムライン上の通常タスク

・タスク内容の表示
・完了チェック
・クリックで編集
・ドラッグで時刻変更
・重なったタスクを横並び表示

======================================== */

import type {
  PointerEvent as ReactPointerEvent,
} from 'react'

import type {
  CSSProperties,
} from 'react'

import type {
  Task,
} from '../types/task'


type Props = {
  task: Task

  top: number

  height: number

  columnIndex: number

  columnCount: number

  isDragging: boolean

  dragTop: number | null

  dragTimeText: string | null

  onToggleComplete:
    (taskId: number) => void

  onEdit:
    (task: Task) => void

  onDragStart:
    (
      event:
        ReactPointerEvent<HTMLDivElement>,
      task: Task
    ) => void
}


function formatTime(
  hour: number,
  minute: number
) {
  return (
    `${String(hour).padStart(2, '0')}:` +
    `${String(minute).padStart(2, '0')}`
  )
}


function TaskBlock({
  task,
  top,
  height,
  columnIndex,
  columnCount,
  isDragging,
  dragTop,
  dragTimeText,
  onToggleComplete,
  onEdit,
  onDragStart,
}: Props) {

  /* ========================================

  開始時刻がない場合は表示しない

  ======================================== */

  if (
    task.startHour === null ||
    task.startMinute === null
  ) {
    return null
  }


  /* ========================================

  表示時刻

  ======================================== */

  const startTimeText =
    formatTime(
      task.startHour,
      task.startMinute
    )

  const endTimeText =
    task.endHour !== null &&
    task.endMinute !== null
      ? formatTime(
          task.endHour,
          task.endMinute
        )
      : ''


  /* ========================================

  タスク時間による表示切替

  10分以下：コンパクト
  60分未満：中サイズ

  ======================================== */

  const isCompact =
    task.durationMinutes <= 10

  const isMedium =
    task.durationMinutes > 10 &&
    task.durationMinutes < 60


  /* ========================================

  重なったタスクの横並び位置

  タイムラインの通常タスク領域
  左 82px / 右 12px を維持する

  ======================================== */

  const safeColumnCount =
    Math.max(
      1,
      columnCount
    )

  const safeColumnIndex =
    Math.max(
      0,
      Math.min(
        columnIndex,
        safeColumnCount - 1
      )
    )

  const leftRatio =
    safeColumnIndex /
    safeColumnCount

  const rightRatio =
    (
      safeColumnCount -
      safeColumnIndex -
      1
    ) /
    safeColumnCount

  const columnGap = 2

  const leftPercent =
    leftRatio * 100

  const rightPercent =
    rightRatio * 100

  const leftPixel =
    82 -
    94 * leftRatio +
    (
      safeColumnIndex > 0
        ? columnGap
        : 0
    )

  const rightPixel =
    12 -
    94 * rightRatio +
    (
      safeColumnIndex <
      safeColumnCount - 1
        ? columnGap
        : 0
    )

  const taskStyle:
    CSSProperties = {
      top:
        `${
          isDragging &&
          dragTop !== null
            ? dragTop
            : top
        }px`,

      height:
        `${height}px`,

      left:
        `calc(${leftPercent}% + ${leftPixel}px)`,

      right:
        `calc(${rightPercent}% + ${rightPixel}px)`,
    }


  /* ========================================

  タスク表示

  ======================================== */

  return (
    <div
      className={[
        'schedule-task',
        isCompact
          ? 'compact'
          : '',
        isMedium
          ? 'medium'
          : '',
        task.completed
          ? 'completed'
          : '',
        isDragging
          ? 'dragging'
          : '',
      ]
        .filter(Boolean)
        .join(' ')
      }
      style={taskStyle}
      onClick={() =>
        onEdit(task)
      }
      onPointerDown={(event) =>
        onDragStart(
          event,
          task
        )
      }
    >

      {dragTimeText && (
        <span className="task-drag-time">
          {dragTimeText}
        </span>
      )}


      {isCompact ? (

        <div className="schedule-task-compact">

          <input
            type="checkbox"
            className="schedule-checkbox"
            checked={task.completed}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) =>
              event.stopPropagation()
            }
            onChange={() =>
              onToggleComplete(
                task.id
              )
            }
          />

          <span className="compact-title">
            {task.title}
          </span>

          <span className="compact-time">
            {startTimeText}
            {' - '}
            {endTimeText}
          </span>

        </div>

      ) : (

        <>

          <div className="schedule-task-title">

            <input
              type="checkbox"
              className="schedule-checkbox"
              checked={task.completed}
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) =>
                event.stopPropagation()
              }
              onChange={() =>
                onToggleComplete(
                  task.id
                )
              }
            />

            <span>
              {task.title}
            </span>

          </div>


          <div className="schedule-task-details">

            <span>
              {startTimeText}
              {' - '}
              {endTimeText}
            </span>

            {!isMedium && (
              <>

                <span className="schedule-task-separator">
                  ・
                </span>

                <span>
                  {task.durationMinutes}分
                </span>

                <span className="priority-badge">
                  優先度：{task.priority}
                </span>

              </>
            )}

          </div>

        </>
      )}

    </div>
  )
}


export default TaskBlock
