/* ========================================

明日の予定調整

・明日だけ時刻変更
・10分単位
・朝 / 夜まとめて移動
・自動配置
・通常ToDoを明日へ移動

======================================== */

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  Task,
} from '../types/task'

import type {
  RoutineItem,
  RoutineTimeOverride,
  RoutineType,
} from '../types/routine'

import {
  autoArrangeRoutineTimes,
  getRoutineTimeForDate,
} from '../utils/routine'

import {
  minutesToTimeString,
  timeStringToMinutes,
} from '../utils/time'


type Props = {
  isOpen: boolean

  date: string

  todayDate: string

  routines:
    RoutineItem[]

  overrides:
    RoutineTimeOverride[]

  tasks:
    Task[]

  onClose: () => void

  onSaveTimes: (
    date: string,
    times:
      Record<
        number,
        string | null
      >
  ) => void

  onMoveTaskToTomorrow:
    (taskId: number) => void
}


function TomorrowRoutineModal({
  isOpen,
  date,
  todayDate,
  routines,
  overrides,
  tasks,
  onClose,
  onSaveTimes,
  onMoveTaskToTomorrow,
}: Props) {

  const [
    times,
    setTimes,
  ] =
    useState<
      Record<
        number,
        string
      >
    >({})


  /* ========================================

  明日の時刻を読み込む

  ======================================== */

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const nextTimes:
      Record<
        number,
        string
      > = {}

    routines.forEach(
      (routine) => {

        nextTimes[
          routine.id
        ] =
          getRoutineTimeForDate(
            routine,
            date,
            overrides
          ) ??
          ''

      }
    )

    setTimes(
      nextTimes
    )

  }, [
    isOpen,
    date,
    routines,
    overrides,
  ])


  /* ========================================

  朝ルーティン

  ======================================== */

  const morningRoutines =
    useMemo(
      () =>
        routines
          .filter(
            (routine) =>
              routine.type ===
              'morning'
          )
          .sort(
            (
              first,
              second
            ) =>
              first.order -
              second.order
          ),

      [routines]
    )


  /* ========================================

  夜ルーティン

  ======================================== */

  const eveningRoutines =
    useMemo(
      () =>
        routines
          .filter(
            (routine) =>
              routine.type ===
              'evening'
          )
          .sort(
            (
              first,
              second
            ) =>
              first.order -
              second.order
          ),

      [routines]
    )


  if (!isOpen) {
    return null
  }


  /* ========================================

  1個の時刻変更

  ======================================== */

  const changeTime = (
    routineId: number,
    value: string
  ) => {
    setTimes(
      (current) => ({
        ...current,

        [routineId]:
          value,
      })
    )
  }


  /* ========================================

  基本時刻へ戻す

  ======================================== */

  const resetToDefault = (
    routine:
      RoutineItem
  ) => {
    setTimes(
      (current) => ({
        ...current,

        [routine.id]:
          routine.defaultTime ??
          '',
      })
    )
  }


  /* ========================================

  朝 / 夜をまとめて
  時間移動

  10分単位

  ======================================== */

  const shiftGroup = (
    type: RoutineType,
    amount: number
  ) => {

    const group =
      routines.filter(
        (routine) =>
          routine.type === type
      )

    setTimes(
      (current) => {

        const next = {
          ...current,
        }

        group.forEach(
          (routine) => {

            const value =
              current[
                routine.id
              ] ??
              ''

            if (!value) {
              return
            }

            const minutes =
              timeStringToMinutes(
                value
              )

            if (
              minutes === null
            ) {
              return
            }

            const shifted =
              Math.max(
                0,

                Math.min(
                  23 *
                    60 +
                    50,

                  minutes +
                    amount
                )
              )

            next[
              routine.id
            ] =
              minutesToTimeString(
                shifted
              )

          }
        )

        return next
      }
    )
  }


  /* ========================================

  所要時間を使って
  後続ルーティンを
  自動配置

  ======================================== */

  const autoArrange = (
    type: RoutineType
  ) => {

    const temporaryOverrides:
      RoutineTimeOverride[] =
      routines.map(
        (routine) => ({
          routineId:
            routine.id,

          date,

          scheduledTime:
            times[
              routine.id
            ] ||
            null,
        })
      )

    const arranged =
      autoArrangeRoutineTimes(
        routines,
        type,
        date,
        temporaryOverrides
      )

    if (
      Object.keys(
        arranged
      ).length === 0
    ) {
      alert(
        '最初のルーティンに時刻を設定してください'
      )

      return
    }

    setTimes(
      (current) => {

        const next = {
          ...current,
        }

        Object.entries(
          arranged
        ).forEach(
          ([
            routineId,
            value,
          ]) => {

            next[
              Number(
                routineId
              )
            ] =
              value ??
              ''

          }
        )

        return next
      }
    )
  }


  /* ========================================

  全部基本時刻へ戻す

  ======================================== */

  const resetAll = () => {

    const next:
      Record<
        number,
        string
      > = {}

    routines.forEach(
      (routine) => {

        next[
          routine.id
        ] =
          routine.defaultTime ??
          ''

      }
    )

    setTimes(next)
  }


  /* ========================================

  保存

  ======================================== */

  const handleSave = () => {

    const result:
      Record<
        number,
        string | null
      > = {}

    routines.forEach(
      (routine) => {

        result[
          routine.id
        ] =
          times[
            routine.id
          ] ||
          null

      }
    )

    onSaveTimes(
      date,
      result
    )

    onClose()
  }


  /* ========================================

  今日の未完了

  ======================================== */

  const todayIncompleteTasks =
    tasks.filter(
      (task) =>
        task.taskDate ===
          todayDate &&
        !task.completed
    )


  /* ========================================

  明日のタスク

  ======================================== */

  const tomorrowTasks =
    tasks.filter(
      (task) =>
        task.taskDate ===
          date &&
        !task.completed
    )


  /* ========================================

  朝 / 夜グループ

  ======================================== */

  const renderGroup = (
    title: string,
    type:
      RoutineType,
    group:
      RoutineItem[]
  ) => (

    <section className="tomorrow-routine-group">

      <div className="tomorrow-routine-group-header">

        <h3>
          {title}
        </h3>

        <div className="tomorrow-routine-shift-buttons">

          <button
            type="button"
            onClick={() =>
              shiftGroup(
                type,
                -30
              )
            }
          >
            -30分
          </button>

          <button
            type="button"
            onClick={() =>
              shiftGroup(
                type,
                -10
              )
            }
          >
            -10分
          </button>

          <button
            type="button"
            onClick={() =>
              shiftGroup(
                type,
                10
              )
            }
          >
            +10分
          </button>

          <button
            type="button"
            onClick={() =>
              shiftGroup(
                type,
                30
              )
            }
          >
            +30分
          </button>

          <button
            type="button"
            className="routine-secondary-button"
            onClick={() =>
              autoArrange(
                type
              )
            }
          >
            自動配置
          </button>

        </div>

      </div>


      <div className="tomorrow-routine-list">

        {group.map(
          (routine) => (

            <div
              key={routine.id}
              className="tomorrow-routine-row"
            >

              <div className="tomorrow-routine-name">

                <strong>
                  {routine.title}
                </strong>

                <span>
                  基本：
                  {routine.defaultTime ??
                    '時間なし'}
                  {' ・ '}
                  {routine.durationMinutes}
                  分
                </span>

              </div>

              <input
                type="time"
                step={600}
                value={
                  times[
                    routine.id
                  ] ??
                  ''
                }
                onChange={(event) =>
                  changeTime(
                    routine.id,
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="routine-text-button"
                onClick={() =>
                  changeTime(
                    routine.id,
                    ''
                  )
                }
              >
                時間なし
              </button>

              <button
                type="button"
                className="routine-text-button"
                onClick={() =>
                  resetToDefault(
                    routine
                  )
                }
              >
                基本に戻す
              </button>

            </div>

          )
        )}

      </div>

    </section>
  )


  return (
    <div className="modal-overlay">

      <div className="routine-modal tomorrow-routine-modal">


        {/* ========================================

        ヘッダー

        ======================================== */}

        <div className="routine-modal-header">

          <div>

            <p className="eyebrow">
              Tomorrow
            </p>

            <h2>
              明日の予定を調整
            </h2>

            <p className="tomorrow-date-label">
              {date}
            </p>

          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        <div className="tomorrow-routine-toolbar">

          <p>
            変更しない項目は基本時刻が使われます。
            ここでの変更は明日だけです。
          </p>

          <button
            type="button"
            className="routine-secondary-button"
            onClick={resetAll}
          >
            全て基本時刻に戻す
          </button>

        </div>


        {renderGroup(
          '朝ルーティン',
          'morning',
          morningRoutines
        )}

        {renderGroup(
          '夜ルーティン',
          'evening',
          eveningRoutines
        )}


        {/* ========================================

        通常ToDo

        ======================================== */}

        <section className="tomorrow-task-section">

          <div className="tomorrow-routine-group-header">

            <h3>
              通常ToDo
            </h3>

          </div>

          <div className="tomorrow-task-columns">

            <div>

              <h4>
                今日の未完了
              </h4>

              {todayIncompleteTasks.length ===
              0 ? (

                <p className="activity-empty">
                  今日の未完了タスクはありません。
                </p>

              ) : (

                todayIncompleteTasks.map(
                  (task) => (

                    <div
                      key={task.id}
                      className="tomorrow-task-row"
                    >

                      <span>
                        {task.title}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          onMoveTaskToTomorrow(
                            task.id
                          )
                        }
                      >
                        明日へ移動
                      </button>

                    </div>

                  )
                )

              )}

            </div>


            <div>

              <h4>
                明日のToDo
              </h4>

              {tomorrowTasks.length ===
              0 ? (

                <p className="activity-empty">
                  明日のタスクはありません。
                </p>

              ) : (

                tomorrowTasks.map(
                  (task) => (

                    <div
                      key={task.id}
                      className="tomorrow-task-row read-only"
                    >

                      <span>
                        {task.title}
                      </span>

                      <span>
                        {task.durationMinutes}
                        分
                      </span>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </section>


        {/* ========================================

        保存

        ======================================== */}

        <div className="routine-modal-footer">

          <span />

          <div className="routine-modal-footer-right">

            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              キャンセル
            </button>

            <button
              type="button"
              className="save-button"
              onClick={handleSave}
            >
              明日の予定を保存
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}


export default TomorrowRoutineModal