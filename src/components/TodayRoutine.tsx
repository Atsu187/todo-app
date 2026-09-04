/* ========================================

Today画面のルーティン一覧

結果は
「やった / やっていない」だけ管理

======================================== */

import type {
  RoutineDayState,
  RoutineItem,
  RoutineTimeOverride,
  RoutineType,
} from '../types/routine'

import {
  getRoutineTimeForDate,
  sortRoutinesForDate,
} from '../utils/routine'


type Props = {
  date: string

  routines: RoutineItem[]

  overrides: RoutineTimeOverride[]

  states: RoutineDayState[]

  onToggleComplete:
    (routineId: number) => void

  onToggleSkip:
    (routineId: number) => void
}


function TodayRoutine({
  date,
  routines,
  overrides,
  states,
  onToggleComplete,
  onToggleSkip,
}: Props) {
  const getState = (
    routineId: number
  ) =>
    states.find(
      (state) =>
        state.date === date &&
        state.routineId === routineId
    )


  /* ========================================

  朝 / 夜グループ

  ======================================== */

  const renderGroup = (
    title: string,
    type: RoutineType
  ) => {
    const group =
      sortRoutinesForDate(
        routines.filter(
          (routine) =>
            routine.type === type
        ),
        date,
        overrides
      )

    const activeGroup =
      group.filter(
        (routine) =>
          !getState(
            routine.id
          )?.skipped
      )

    const completedCount =
      activeGroup.filter(
        (routine) =>
          getState(
            routine.id
          )?.completed
      ).length

    return (
      <section className="today-routine-group">
        <div className="today-routine-group-header">
          <div>
            <h3>{title}</h3>
          </div>

          <span className="today-routine-count">
            {completedCount}
            {' / '}
            {activeGroup.length}
          </span>
        </div>

        <div className="today-routine-list">
          {group.map(
            (routine) => {
              const state =
                getState(
                  routine.id
                )

              const scheduledTime =
                getRoutineTimeForDate(
                  routine,
                  date,
                  overrides
                )

              const skipped =
                state?.skipped ?? false

              const completed =
                state?.completed ?? false

              return (
                <div
                  key={routine.id}
                  className={[
                    'today-routine-item',
                    completed
                      ? 'completed'
                      : '',
                    skipped
                      ? 'skipped'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <label className="today-routine-main">
                    <input
                      type="checkbox"
                      checked={completed}
                      disabled={skipped}
                      onChange={() =>
                        onToggleComplete(
                          routine.id
                        )
                      }
                    />

                    <span className="today-routine-title">
                      {routine.title}
                    </span>
                  </label>

                  <span className="today-routine-time">
                    {scheduledTime
                      ? scheduledTime
                      : '時間なし'}
                    {' ・ '}
                    {routine.durationMinutes}分
                  </span>

                  <button
                    type="button"
                    className="routine-skip-button"
                    onClick={() =>
                      onToggleSkip(
                        routine.id
                      )
                    }
                  >
                    {skipped
                      ? '今日やるに戻す'
                      : '今日はやらない'}
                  </button>
                </div>
              )
            }
          )}
        </div>
      </section>
    )
  }


  return (
    <section className="today-routine-section">
      <div className="today-routine-header">
        <div>
          <p className="eyebrow">
            Routine
          </p>

          <h2>
            今日のルーティン
          </h2>
        </div>
      </div>

      <div className="today-routine-groups">
        {renderGroup(
          '朝ルーティン',
          'morning'
        )}

        {renderGroup(
          '夜ルーティン',
          'evening'
        )}
      </div>
    </section>
  )
}

export default TodayRoutine
