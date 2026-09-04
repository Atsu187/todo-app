/* ========================================

活動カレンダーの日付詳細

表示するもの
・起床時刻
・朝 / 夜ルーティン結果
・通常タスク結果
・1日の振り返り

======================================== */

import type {
  Task,
  TaskDayResult,
} from '../types/task'

import type {
  DailyLifeLog,
  RoutineDayState,
  RoutineItem,
} from '../types/routine'


type Props = {
  selectedDate: string | null

  routines: RoutineItem[]

  routineStates: RoutineDayState[]

  tasks: Task[]

  taskDayResults: TaskDayResult[]

  lifeLogs: DailyLifeLog[]

  onClose: () => void
}


function ActivityRecordModal({
  selectedDate,
  routines,
  routineStates,
  tasks,
  taskDayResults,
  lifeLogs,
  onClose,
}: Props) {
  if (!selectedDate) {
    return null
  }

  const lifeLog =
    lifeLogs.find(
      (log) =>
        log.date === selectedDate
    )

  const getRoutineState = (
    routineId: number
  ) =>
    routineStates.find(
      (state) =>
        state.date === selectedDate &&
        state.routineId === routineId
    )

  const morningRoutines =
    routines
      .filter(
        (routine) =>
          routine.type === 'morning'
      )
      .sort(
        (first, second) =>
          first.order - second.order
      )

  const eveningRoutines =
    routines
      .filter(
        (routine) =>
          routine.type === 'evening'
      )
      .sort(
        (first, second) =>
          first.order - second.order
      )

  const recordedTaskResults =
    taskDayResults.filter(
      (result) =>
        result.date === selectedDate
    )

  const currentDateTasks =
    tasks.filter(
      (task) =>
        task.taskDate === selectedDate
    )

  const taskRows =
    recordedTaskResults.length > 0
      ? recordedTaskResults
      : currentDateTasks.map(
          (task) => ({
            date: selectedDate,
            taskId: task.id,
            title: task.title,
            completed: task.completed,
          })
        )


  /* ========================================

  ルーティン一覧表示

  ======================================== */

  const renderRoutineGroup = (
    title: string,
    group: RoutineItem[]
  ) => (
    <section className="activity-record-section">
      <div className="activity-record-section-header">
        <h3>{title}</h3>
      </div>

      <div className="activity-record-list">
        {group.map(
          (routine) => {
            const state =
              getRoutineState(
                routine.id
              )

            const skipped =
              state?.skipped ?? false

            const completed =
              state?.completed ?? false

            return (
              <div
                key={routine.id}
                className="activity-record-item"
              >
                <span className="activity-record-check">
                  {skipped
                    ? '−'
                    : completed
                      ? '✓'
                      : '□'}
                </span>

                <span className="activity-record-title">
                  {routine.title}
                </span>

                <span className="activity-record-time">
                  {skipped
                    ? '対象外'
                    : completed
                      ? 'できた'
                      : 'できなかった'}
                </span>
              </div>
            )
          }
        )}
      </div>
    </section>
  )


  return (
    <div className="modal-overlay">
      <div className="activity-record-modal">
        <div className="activity-record-header">
          <div>
            <p className="eyebrow">
              Activity Log
            </p>

            <h2>
              {selectedDate} の記録
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="activity-record-content">
          <section className="activity-record-section life-log-detail">
            <h3>
              生活記録
            </h3>

            <div className="life-log-detail-row">
              <span>起床</span>
              <strong>
                {lifeLog?.wakeUpTime ?? '記録なし'}
              </strong>
            </div>
          </section>

          {renderRoutineGroup(
            '朝ルーティン',
            morningRoutines
          )}

          {renderRoutineGroup(
            '夜ルーティン',
            eveningRoutines
          )}

          <section className="activity-record-section">
            <h3>
              通常タスク
            </h3>

            {taskRows.length === 0 ? (
              <p className="activity-empty">
                タスク記録はありません。
              </p>
            ) : (
              <div className="activity-record-list">
                {taskRows.map(
                  (result) => (
                    <div
                      key={result.taskId}
                      className="activity-record-item"
                    >
                      <span className="activity-record-check">
                        {result.completed
                          ? '✓'
                          : '□'}
                      </span>

                      <span className="activity-record-title">
                        {result.title}
                      </span>

                      <span className="activity-record-time">
                        {result.completed
                          ? 'できた'
                          : 'できなかった'}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <section className="activity-record-section">
            <h3>
              1日の振り返り
            </h3>

            <p className="reflection-readonly">
              {lifeLog?.reflection?.trim()
                ? lifeLog.reflection
                : '記録はありません。'}
            </p>
          </section>
        </div>

        <div className="activity-record-footer">
          <button
            type="button"
            className="save-button"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityRecordModal
