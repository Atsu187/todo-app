/* ========================================

右側の「今日のToDo」

・時間未設定の通常タスク
・時間未設定のルーティン
・通常タスクはタイムラインへ
  ドラッグして時刻設定できる

======================================== */

import {
  useState,
} from 'react'

import type {
  DragEvent,
} from 'react'

import type {
  Task,
} from '../types/task'

import type {
  RoutineDayState,
  RoutineItem,
  RoutineTimeOverride,
} from '../types/routine'

import {
  formatMonthDay,
} from '../utils/date'

import {
  getRoutineTimeForDate,
} from '../utils/routine'

import {
  clearActiveTodoTaskId,
  setActiveTodoTaskId,
} from '../utils/dragStore'


type Props = {
  date: string

  tasks: Task[]

  routines: RoutineItem[]

  routineOverrides:
    RoutineTimeOverride[]

  routineStates:
    RoutineDayState[]

  onToggleComplete:
    (taskId: number) => void

  onEditTask:
    (task: Task) => void

  onToggleRoutine:
    (routineId: number) => void

  onToggleRoutineSkip:
    (routineId: number) => void
}


function TodoPanel({
  date,
  tasks,
  routines,
  routineOverrides,
  routineStates,
  onToggleComplete,
  onEditTask,
  onToggleRoutine,
  onToggleRoutineSkip,
}: Props) {

  /* ========================================

  ドラッグ中のタスク

  ======================================== */

  const [
    draggingTaskId,
    setDraggingTaskId,
  ] =
    useState<number | null>(
      null
    )


  /* ========================================

  時間未設定の通常タスク

  ======================================== */

  const unscheduledTasks =
    tasks.filter(
      (task) =>
        task.taskDate === date &&
        (
          task.startHour === null ||
          task.startMinute === null
        )
    )


  /* ========================================

  時間未設定のルーティン

  ======================================== */

  const unscheduledRoutines =
    routines.filter(
      (routine) =>
        getRoutineTimeForDate(
          routine,
          date,
          routineOverrides
        ) === null
    )


  /* ========================================

  通常タスクのドラッグ開始

  タスクIDを
  タイムラインへ渡す

  ======================================== */

  const handleTaskDragStart = (
    event:
      DragEvent<HTMLDivElement>,
    task: Task
  ) => {
    setDraggingTaskId(
      task.id
    )

    setActiveTodoTaskId(
      task.id
    )

    event.dataTransfer.effectAllowed =
      'move'

    event.dataTransfer.setData(
      'application/x-todo-task-id',
      String(task.id)
    )

    event.dataTransfer.setData(
      'text/plain',
      String(task.id)
    )
  }


  /* ========================================

  ドラッグ終了

  ======================================== */

  const handleTaskDragEnd = () => {
    setDraggingTaskId(
      null
    )

    clearActiveTodoTaskId()
  }


  return (
    <aside
      className="todo-panel"
      data-todo-drop-zone="true"
    >

      <div className="todo-header">

        <div>

          <p className="eyebrow">
            Unscheduled
          </p>

          <h2>
            今日のToDo
          </h2>

        </div>

      </div>


      <div className="todo-table-header">

        <span>
          タスク
        </span>

        <span>
          時間
        </span>

        <span>
          期限
        </span>

        <span>
          優先度
        </span>

      </div>


      {/* ========================================

      通常タスク

      タイムラインへ
      ドラッグ可能

      ======================================== */}

      {unscheduledTasks.map(
        (task) => {

          const isDragging =
            draggingTaskId ===
            task.id

          return (
            <div
              className={[
                'todo-item',

                'todo-item-draggable',

                isDragging
                  ? 'dragging'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
              }
              key={task.id}
              draggable
              onDragStart={(
                event
              ) =>
                handleTaskDragStart(
                  event,
                  task
                )
              }
              onDragEnd={
                handleTaskDragEnd
              }
              onClick={() =>
                onEditTask(task)
              }
            >

              <span className="todo-task-name">

                <input
                  type="checkbox"
                  checked={
                    task.completed
                  }
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                  onChange={() =>
                    onToggleComplete(
                      task.id
                    )
                  }
                />

                <span
                  className={
                    task.completed
                      ? 'todo-title-completed'
                      : ''
                  }
                >
                  {task.title}
                </span>

              </span>

              <span>
                {task.durationMinutes}
                分
              </span>

              <span>
                {formatMonthDay(
                  task.dueDate
                )}
              </span>

              <span>
                {task.priority}
              </span>

            </div>
          )
        }
      )}


      {/* ========================================

      時間なしルーティン

      今回はドラッグ対象外

      ======================================== */}

      {unscheduledRoutines.map(
        (routine) => {

          const state =
            routineStates.find(
              (item) =>
                item.date ===
                  date &&
                item.routineId ===
                  routine.id
            )

          const completed =
            state?.completed ??
            false

          const skipped =
            state?.skipped ??
            false

          return (
            <div
              className={[
                'todo-item',

                'todo-routine-item',

                skipped
                  ? 'skipped'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
              }
              key={
                `routine-${routine.id}`
              }
            >

              <span className="todo-task-name">

                <input
                  type="checkbox"
                  checked={completed}
                  disabled={skipped}
                  onChange={() =>
                    onToggleRoutine(
                      routine.id
                    )
                  }
                />

                <span
                  className={
                    completed
                      ? 'todo-title-completed'
                      : ''
                  }
                >
                  {routine.title}

                  <small className="routine-label">
                    ルーティン
                  </small>

                </span>

              </span>

              <span>
                {routine.durationMinutes}
                分
              </span>

              <span>
                —
              </span>

              <button
                type="button"
                className="
                  routine-skip-button
                  small
                "
                onClick={() =>
                  onToggleRoutineSkip(
                    routine.id
                  )
                }
              >
                {skipped
                  ? '戻す'
                  : '今日はやらない'}
              </button>

            </div>
          )
        }
      )}


      {/* ========================================

      空の場合

      ======================================== */}

      {unscheduledTasks.length ===
        0 &&
        unscheduledRoutines.length ===
          0 && (

          <div className="todo-empty">
            時間未設定のToDoはありません。
          </div>

        )}

    </aside>
  )
}


export default TodoPanel