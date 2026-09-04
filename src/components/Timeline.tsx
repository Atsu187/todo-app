/* ========================================

中央タイムライン

・4:00〜24:00
・10分刻み表示
・1時間 = 120px
・10分 = 20px
・ドラッグは5分刻み
・現在時刻
・通常タスク
・ルーティン
・現在時刻付近へ自動スクロール
・右ToDoからタスクを配置

5:00開始の予定でも
上に1時間余白を確保する

======================================== */

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'

import type {
  Task,
} from '../types/task'

import type {
  RoutineDayState,
  RoutineItem,
  RoutineTimeOverride,
} from '../types/routine'

import TaskBlock from './TaskBlock'

import {
  getRoutineTimeForDate,
} from '../utils/routine'

import {
  minutesToTimeString,
  timeStringToMinutes,
} from '../utils/time'

import {
  getActiveTodoTaskId,
} from '../utils/dragStore'

import './Timeline.css'


type Props = {
  tasks: Task[]

  now: Date

  date: string

  routines: RoutineItem[]

  routineOverrides:
    RoutineTimeOverride[]

  routineStates:
    RoutineDayState[]

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
}


type DragState = {
  taskId: number

  pointerStartY: number

  originalTop: number

  currentTop: number

  snappedStartMinutes: number

  moved: boolean
}


type RoutineDragState = {
  routineId: number

  pointerStartY: number

  originalTop: number

  currentTop: number

  snappedStartMinutes: number

  moved: boolean
}


type TodoDropPreview = {
  taskId: number

  startMinutes: number

  top: number

  height: number
}


function Timeline({
  tasks,
  now,
  date,
  routines,
  routineOverrides,
  routineStates,
  onToggleComplete,
  onEditTask,
  onMoveTask,
  onUnscheduleTask,
  onMoveRoutine,
  onToggleRoutine,
  onToggleRoutineSkip,
}: Props) {

  const timelineBodyRef =
    useRef<HTMLElement | null>(
      null
    )

  const hasAutoScrolledRef =
    useRef(false)

  const dragStateRef =
    useRef<DragState | null>(
      null
    )

  const routineDragStateRef =
    useRef<RoutineDragState | null>(
      null
    )


  /* ========================================

  ドラッグ直後のクリックを
  1回だけ無効にする

  ======================================== */

  const suppressClickTaskIdRef =
    useRef<number | null>(
      null
    )

  const suppressClickRoutineIdRef =
    useRef<number | null>(
      null
    )


  const [
    selectedRoutineId,
    setSelectedRoutineId,
  ] =
    useState<number | null>(
      null
    )

  const [
    dragState,
    setDragState,
  ] =
    useState<DragState | null>(
      null
    )

  const [
    routineDragState,
    setRoutineDragState,
  ] =
    useState<RoutineDragState | null>(
      null
    )


  /* ========================================

  右ToDoからドラッグしたときの
  配置予定位置

  ======================================== */

  const [
    todoDropPreview,
    setTodoDropPreview,
  ] =
    useState<TodoDropPreview | null>(
      null
    )


  /* ========================================

  タイムライン範囲

  ======================================== */

  const startHourOfTimeline = 4

  const endHourOfTimeline = 24


  /* ========================================

  高さ

  1時間 = 120px
  1分 = 2px
  5分 = 10px
  10分 = 20px

  ======================================== */

  const hourHeight = 120

  const minuteHeight =
    hourHeight / 60

  const tenMinuteHeight = 20

  const snapMinutes = 5


  /* ========================================

  現在時刻線

  ======================================== */

  const minutesFromStart =
    (
      now.getHours() -
      startHourOfTimeline
    ) *
      60 +
    now.getMinutes()

  const currentTimeTop =
    minutesFromStart *
    minuteHeight

  const showCurrentTime =
    minutesFromStart >= 0 &&
    minutesFromStart <=
      (
        endHourOfTimeline -
        startHourOfTimeline
      ) *
        60


  /* ========================================

  最初の1回だけ
  現在時刻付近へスクロール

  ======================================== */

  useEffect(() => {
    if (
      !showCurrentTime ||
      hasAutoScrolledRef.current
    ) {
      return
    }

    const timer =
      setTimeout(
        () => {
          const timeline =
            timelineBodyRef.current

          if (!timeline) {
            return
          }

          const targetScroll =
            currentTimeTop -
            timeline.clientHeight *
              0.35

          timeline.scrollTo({
            top:
              Math.max(
                0,
                targetScroll
              ),

            behavior:
              'smooth',
          })

          hasAutoScrolledRef.current =
            true
        },
        300
      )

    return () =>
      clearTimeout(timer)

  }, [
    showCurrentTime,
    currentTimeTop,
  ])


  /* ========================================

  時刻から縦位置を計算

  ======================================== */

  const getTopFromMinutes = (
    totalMinutes: number
  ) => {
    const fromStart =
      totalMinutes -
      startHourOfTimeline *
        60

    return (
      fromStart *
      minuteHeight
    )
  }


  const getTaskTop = (
    hour: number,
    minute: number
  ) => {
    return getTopFromMinutes(
      hour * 60 +
      minute
    )
  }


  /* ========================================

  所要時間から高さを計算

  ======================================== */

  const getHeight = (
    durationMinutes: number
  ) => {
    return Math.max(
      tenMinuteHeight,

      durationMinutes *
        minuteHeight
    )
  }


  /* ========================================

  今日の通常タスク

  ======================================== */

  const scheduledTasks =
    tasks.filter(
      (task) =>
        task.taskDate ===
          date &&
        task.startHour !==
          null &&
        task.startMinute !==
          null
    )


  /* ========================================

  重なったタスクを横並びにする

  ======================================== */

  const taskLayout = new Map<
    number,
    { columnIndex: number; columnCount: number }
  >()

  const sortedForLayout =
    [...scheduledTasks].sort((first, second) =>
      ((first.startHour ?? 0) * 60 +
        (first.startMinute ?? 0)) -
      ((second.startHour ?? 0) * 60 +
        (second.startMinute ?? 0))
    )

  let overlapGroup: Task[] = []
  let overlapGroupEnd = -1

  const flushOverlapGroup = () => {
    if (overlapGroup.length === 0) {
      return
    }

    const columnEnds: number[] = []
    const assignments = new Map<number, number>()

    overlapGroup.forEach((task) => {
      const start =
        (task.startHour ?? 0) * 60 +
        (task.startMinute ?? 0)
      const end = start + task.durationMinutes

      let column = columnEnds.findIndex(
        (columnEnd) => columnEnd <= start
      )

      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(end)
      } else {
        columnEnds[column] = end
      }

      assignments.set(task.id, column)
    })

    const columnCount =
      Math.max(1, columnEnds.length)

    overlapGroup.forEach((task) => {
      taskLayout.set(task.id, {
        columnIndex:
          assignments.get(task.id) ?? 0,
        columnCount,
      })
    })

    overlapGroup = []
    overlapGroupEnd = -1
  }

  sortedForLayout.forEach((task) => {
    const start =
      (task.startHour ?? 0) * 60 +
      (task.startMinute ?? 0)
    const end = start + task.durationMinutes

    if (
      overlapGroup.length > 0 &&
      start >= overlapGroupEnd
    ) {
      flushOverlapGroup()
    }

    overlapGroup.push(task)
    overlapGroupEnd = Math.max(
      overlapGroupEnd,
      end
    )
  })

  flushOverlapGroup()


  /* ========================================

  今日の時間ありルーティン

  ======================================== */

  const scheduledRoutines =
    routines
      .map(
        (routine) => ({
          routine,

          time:
            getRoutineTimeForDate(
              routine,
              date,
              routineOverrides
            ),
        })
      )
      .filter(
        (item) =>
          item.time !== null
      )


  /* ========================================

  4:00〜23:00

  ======================================== */

  const timelineHours =
    Array.from(
      {
        length:
          endHourOfTimeline -
          startHourOfTimeline,
      },

      (_, index) =>
        index +
        startHourOfTimeline
    )


  /* ========================================

  ルーティン終了時刻

  ======================================== */

  const getRoutineEndTime = (
    startTime: string,
    durationMinutes: number
  ) => {
    const startMinutes =
      timeStringToMinutes(
        startTime
      )

    if (
      startMinutes === null
    ) {
      return ''
    }

    return minutesToTimeString(
      startMinutes +
        durationMinutes
    )
  }


  /* ========================================

  開始時刻をタイムライン範囲に
  収める

  ======================================== */

  const clampStartMinutes = (
    startMinutes: number,
    durationMinutes: number
  ) => {
    const minimum =
      startHourOfTimeline *
      60

    const maximum =
      endHourOfTimeline *
        60 -
      durationMinutes

    return Math.max(
      minimum,
      Math.min(
        startMinutes,
        maximum
      )
    )
  }


  /* ========================================

  5分刻みに丸める

  ======================================== */

  const snapStartMinutes = (
    rawMinutes: number
  ) => {
    return (
      Math.round(
        rawMinutes /
        snapMinutes
      ) *
      snapMinutes
    )
  }


  /* ========================================

  タイムライン内の
  ドラッグ開始

  ======================================== */

  const handleTaskDragStart = (
    event:
      ReactPointerEvent<HTMLDivElement>,
    task: Task
  ) => {
    if (
      task.startHour === null ||
      task.startMinute === null
    ) {
      return
    }

    event.preventDefault()

    const startMinutes =
      task.startHour * 60 +
      task.startMinute

    const originalTop =
      getTopFromMinutes(
        startMinutes
      )

    const initialState:
      DragState = {
        taskId: task.id,

        pointerStartY:
          event.clientY,

        originalTop,

        currentTop:
          originalTop,

        snappedStartMinutes:
          startMinutes,

        moved: false,
      }

    dragStateRef.current =
      initialState

    setDragState(
      initialState
    )

    window.addEventListener(
      'pointermove',
      handleTaskDragMove
    )

    window.addEventListener(
      'pointerup',
      handleTaskDragEnd
    )
  }


  /* ========================================

  タイムライン内の
  ドラッグ中

  5分刻みで吸着

  ======================================== */

  const handleTaskDragMove = (
    event: PointerEvent
  ) => {
    const current =
      dragStateRef.current

    if (!current) {
      return
    }

    const deltaY =
      event.clientY -
      current.pointerStartY

    const moved =
      current.moved ||
      Math.abs(deltaY) >= 4

    const rawTop =
      current.originalTop +
      deltaY

    const rawMinutesFromStart =
      rawTop /
      minuteHeight

    let snappedMinutesFromStart =
      Math.round(
        rawMinutesFromStart /
        snapMinutes
      ) *
      snapMinutes

    const task =
      tasks.find(
        (item) =>
          item.id ===
          current.taskId
      )

    const duration =
      task?.durationMinutes ??
      10

    const timelineDuration =
      (
        endHourOfTimeline -
        startHourOfTimeline
      ) *
        60

    const maxStart =
      Math.max(
        0,
        timelineDuration -
          duration
      )

    snappedMinutesFromStart =
      Math.max(
        0,
        Math.min(
          snappedMinutesFromStart,
          maxStart
        )
      )

    const snappedStartMinutes =
      startHourOfTimeline *
        60 +
      snappedMinutesFromStart

    const nextState:
      DragState = {
        ...current,

        currentTop:
          snappedMinutesFromStart *
          minuteHeight,

        snappedStartMinutes,

        moved,
      }

    dragStateRef.current =
      nextState

    setDragState(
      nextState
    )
  }


  /* ========================================

  タイムライン内の
  ドラッグ終了

  実際に動かした場合だけ
  開始時刻を保存する

  ======================================== */

  const handleTaskDragEnd = (
    event: PointerEvent
  ) => {
    const current =
      dragStateRef.current

    window.removeEventListener(
      'pointermove',
      handleTaskDragMove
    )

    window.removeEventListener(
      'pointerup',
      handleTaskDragEnd
    )

    dragStateRef.current =
      null

    setDragState(
      null
    )

    if (!current) {
      return
    }

    if (current.moved) {

      /* ========================================

      ドラッグ直後のクリックを
      無効にする

      ======================================== */

      suppressClickTaskIdRef.current =
        current.taskId

      const dropTarget =
        document.elementFromPoint(
          event.clientX,
          event.clientY
        )

      const droppedOnTodo =
        dropTarget?.closest(
          '[data-todo-drop-zone="true"]'
        )

      if (droppedOnTodo) {
        onUnscheduleTask(
          current.taskId
        )

        return
      }

      onMoveTask(
        current.taskId,
        current.snappedStartMinutes
      )

      window.setTimeout(
        () => {
          if (
            suppressClickTaskIdRef.current ===
            current.taskId
          ) {
            suppressClickTaskIdRef.current =
              null
          }
        },
        0
      )
    }
  }


  /* ========================================

  タスク編集

  通常クリック
  → 編集画面を開く

  ドラッグ直後
  → 編集画面を開かない

  ======================================== */

  const handleTaskEdit = (
    task: Task
  ) => {
    if (
      suppressClickTaskIdRef.current ===
      task.id
    ) {
      suppressClickTaskIdRef.current =
        null

      return
    }

    onEditTask(
      task
    )
  }


  /* ========================================

  右ToDoからドラッグ中

  マウス位置から
  5分刻みの開始時刻を計算

  ======================================== */

  const handleTodoDragOver = (
    event:
      ReactDragEvent<HTMLElement>
  ) => {
    const taskId =
      getActiveTodoTaskId()

    if (taskId === null) {
      return
    }

    const task =
      tasks.find(
        (item) =>
          item.id === taskId
      )

    if (
      !task ||
      task.taskDate !== date
    ) {
      return
    }

    event.preventDefault()

    event.dataTransfer.dropEffect =
      'move'

    const timeline =
      timelineBodyRef.current

    if (!timeline) {
      return
    }

    const rect =
      timeline.getBoundingClientRect()

    const contentY =
      event.clientY -
      rect.top +
      timeline.scrollTop

    const rawMinutes =
      startHourOfTimeline *
        60 +
      contentY /
        minuteHeight

    const snapped =
      snapStartMinutes(
        rawMinutes
      )

    const startMinutes =
      clampStartMinutes(
        snapped,
        task.durationMinutes
      )

    setTodoDropPreview({
      taskId: task.id,
      startMinutes,
      top:
        getTopFromMinutes(
          startMinutes
        ),
      height:
        getHeight(
          task.durationMinutes
        ),
    })
  }


  /* ========================================

  タイムラインから
  ドラッグが外れた場合

  ======================================== */

  const handleTodoDragLeave = (
    event:
      ReactDragEvent<HTMLElement>
  ) => {
    const timeline =
      timelineBodyRef.current

    if (!timeline) {
      return
    }

    const nextTarget =
      event.relatedTarget

    if (
      nextTarget instanceof Node &&
      timeline.contains(
        nextTarget
      )
    ) {
      return
    }

    setTodoDropPreview(
      null
    )
  }


  /* ========================================

  右ToDoをタイムラインへ配置

  離した瞬間に保存

  ======================================== */

  const handleTodoDrop = (
    event:
      ReactDragEvent<HTMLElement>
  ) => {
    event.preventDefault()

    const preview =
      todoDropPreview

    setTodoDropPreview(
      null
    )

    if (!preview) {
      return
    }

    onMoveTask(
      preview.taskId,
      preview.startMinutes
    )
  }


  /* ========================================

  ルーティンをドラッグ開始

  その日の時刻だけ変更する

  ======================================== */

  const handleRoutineDragStart = (
    event:
      ReactPointerEvent<HTMLDivElement>,
    routineId: number,
    startMinutes: number
  ) => {
    event.preventDefault()

    const originalTop =
      getTopFromMinutes(
        startMinutes
      )

    const initialState:
      RoutineDragState = {
        routineId,
        pointerStartY:
          event.clientY,
        originalTop,
        currentTop:
          originalTop,
        snappedStartMinutes:
          startMinutes,
        moved: false,
      }

    routineDragStateRef.current =
      initialState

    setRoutineDragState(
      initialState
    )

    window.addEventListener(
      'pointermove',
      handleRoutineDragMove
    )

    window.addEventListener(
      'pointerup',
      handleRoutineDragEnd
    )
  }


  /* ========================================

  ルーティンドラッグ中

  5分刻みで吸着

  ======================================== */

  const handleRoutineDragMove = (
    event: PointerEvent
  ) => {
    const current =
      routineDragStateRef.current

    if (!current) {
      return
    }

    const routine =
      routines.find(
        (item) =>
          item.id ===
          current.routineId
      )

    if (!routine) {
      return
    }

    const deltaY =
      event.clientY -
      current.pointerStartY

    const moved =
      current.moved ||
      Math.abs(deltaY) >= 4

    const rawMinutes =
      startHourOfTimeline * 60 +
      (
        current.originalTop +
        deltaY
      ) / minuteHeight

    const snapped =
      snapStartMinutes(
        rawMinutes
      )

    const startMinutes =
      clampStartMinutes(
        snapped,
        routine.durationMinutes
      )

    const nextState:
      RoutineDragState = {
        ...current,
        currentTop:
          getTopFromMinutes(
            startMinutes
          ),
        snappedStartMinutes:
          startMinutes,
        moved,
      }

    routineDragStateRef.current =
      nextState

    setRoutineDragState(
      nextState
    )
  }


  /* ========================================

  ルーティンドラッグ終了

  ======================================== */

  const handleRoutineDragEnd = () => {
    const current =
      routineDragStateRef.current

    window.removeEventListener(
      'pointermove',
      handleRoutineDragMove
    )

    window.removeEventListener(
      'pointerup',
      handleRoutineDragEnd
    )

    routineDragStateRef.current =
      null

    setRoutineDragState(
      null
    )

    if (
      !current ||
      !current.moved
    ) {
      return
    }

    suppressClickRoutineIdRef.current =
      current.routineId

    onMoveRoutine(
      current.routineId,
      current.snappedStartMinutes
    )

    window.setTimeout(
      () => {
        if (
          suppressClickRoutineIdRef.current ===
          current.routineId
        ) {
          suppressClickRoutineIdRef.current =
            null
        }
      },
      0
    )
  }


  return (
    <section
      className={[
        'timeline-body',

        'timeline-body-ten-minute',

        todoDropPreview
          ? 'todo-drop-active'
          : '',
      ]
        .filter(Boolean)
        .join(' ')
      }
      ref={
        timelineBodyRef
      }
      onDragOver={
        handleTodoDragOver
      }
      onDragLeave={
        handleTodoDragLeave
      }
      onDrop={
        handleTodoDrop
      }
    >

      {/* ========================================

      現在時刻

      ======================================== */}

      {showCurrentTime && (

        <div
          className="current-time-line"
          style={{
            top:
              `${currentTimeTop}px`,
          }}
        >

          <span className="current-time-label">
            {now.toLocaleTimeString(
              'ja-JP',
              {
                hour:
                  '2-digit',

                minute:
                  '2-digit',
              }
            )}
          </span>

        </div>

      )}


      {/* ========================================

      右ToDoから配置するときの
      プレビュー

      ======================================== */}

      {todoDropPreview && (() => {

        const previewTask =
          tasks.find(
            (task) =>
              task.id ===
              todoDropPreview.taskId
          )

        if (!previewTask) {
          return null
        }

        const endMinutes =
          todoDropPreview
            .startMinutes +
          previewTask
            .durationMinutes

        return (
          <div
            className="todo-drop-preview"
            style={{
              top:
                `${todoDropPreview.top}px`,

              height:
                `${todoDropPreview.height}px`,
            }}
          >

            <div className="todo-drop-preview-title">
              {previewTask.title}
            </div>

            <div className="todo-drop-preview-time">
              {minutesToTimeString(
                todoDropPreview
                  .startMinutes
              )}
              {' - '}
              {minutesToTimeString(
                endMinutes
              )}
            </div>

          </div>
        )
      })()}


      {/* ========================================

      通常タスク

      ======================================== */}

      {scheduledTasks.map(
        (task) => {

          if (
            task.startHour ===
              null ||
            task.startMinute ===
              null
          ) {
            return null
          }

          const isDragging =
            dragState?.taskId ===
            task.id

          return (
            <TaskBlock
              key={task.id}
              task={task}
              top={
                getTaskTop(
                  task.startHour,
                  task.startMinute
                )
              }
              height={
                getHeight(
                  task.durationMinutes
                )
              }
              columnIndex={
                taskLayout.get(task.id)
                  ?.columnIndex ?? 0
              }
              columnCount={
                taskLayout.get(task.id)
                  ?.columnCount ?? 1
              }
              isDragging={
                isDragging
              }
              dragTop={
                isDragging
                  ? dragState.currentTop
                  : null
              }
              dragTimeText={
                isDragging
                  ? minutesToTimeString(
                      dragState
                        .snappedStartMinutes
                    )
                  : null
              }
              onToggleComplete={
                onToggleComplete
              }
              onEdit={
                handleTaskEdit
              }
              onDragStart={
                handleTaskDragStart
              }
            />
          )
        }
      )}


      {/* ========================================

      ルーティン

      ======================================== */}

      {scheduledRoutines.map(
        ({
          routine,
          time,
        }) => {

          if (!time) {
            return null
          }

          const minutes =
            timeStringToMinutes(
              time
            )

          if (
            minutes === null ||
            minutes <
              startHourOfTimeline *
                60 ||
            minutes >=
              endHourOfTimeline *
                60
          ) {
            return null
          }

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

          const isSelected =
            selectedRoutineId ===
            routine.id

          const isRoutineDragging =
            routineDragState?.routineId ===
            routine.id

          const displayMinutes =
            isRoutineDragging
              ? routineDragState
                  .snappedStartMinutes
              : minutes

          const displayTime =
            minutesToTimeString(
              displayMinutes
            )

          const endTime =
            getRoutineEndTime(
              time,
              routine.durationMinutes
            )

          return (
            <div
              key={
                `routine-${routine.id}`
              }
              className={[
                'routine-schedule-block',

                'routine-schedule-block-clean',

                routine.durationMinutes <=
                10
                  ? 'compact'
                  : '',

                completed
                  ? 'completed'
                  : '',

                skipped
                  ? 'skipped'
                  : '',

                isSelected
                  ? 'selected'
                  : '',

                isRoutineDragging
                  ? 'dragging'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
              }
              style={{
                top:
                  `${getTopFromMinutes(
                    displayMinutes
                  )}px`,

                height:
                  `${getHeight(
                    routine.durationMinutes
                  )}px`,
              }}
              onPointerDown={(event) =>
                handleRoutineDragStart(
                  event,
                  routine.id,
                  minutes
                )
              }
              onClick={() => {
                if (
                  suppressClickRoutineIdRef.current ===
                  routine.id
                ) {
                  suppressClickRoutineIdRef.current =
                    null

                  return
                }

                setSelectedRoutineId(
                  isSelected
                    ? null
                    : routine.id
                )
              }}
            >

              <label
                className="routine-schedule-main-clean"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >

                <input
                  type="checkbox"
                  checked={
                    completed
                  }
                  disabled={
                    skipped
                  }
                  onChange={() =>
                    onToggleRoutine(
                      routine.id
                    )
                  }
                />

                <span className="routine-schedule-title-clean">
                  {routine.title}
                </span>

              </label>

              <span className="routine-schedule-time-clean">
                {displayTime}
              </span>

              {isSelected && (

                <div
                  className="routine-schedule-actions"
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >

                  <span>
                    {time}
                    {' - '}
                    {endTime}
                    {' ・ '}
                    {routine.durationMinutes}
                    分
                  </span>

                  <button
                    type="button"
                    className="routine-schedule-skip-clean"
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

              )}

            </div>
          )
        }
      )}


      {/* ========================================

      10分刻みタイムライン

      ======================================== */}

      <div className="time-grid">

        {timelineHours.map(
          (hour) => (

            <div
              className="
                time-row
                time-row-ten-minute
              "
              key={hour}
            >

              <span className="time-label">
                {String(
                  hour
                ).padStart(
                  2,
                  '0'
                )}
                :00
              </span>

            </div>

          )
        )}

      </div>

    </section>
  )
}


export default Timeline