/* ========================================

朝・夜ルーティン一覧

======================================== */

import type {
  RoutineItem as RoutineItemType,
  RoutineType,
} from '../types/routine'

import RoutineItem from './RoutineItem'


type Props = {
  title: string

  type: RoutineType

  routines: RoutineItemType[]

  onAdd:
    (type: RoutineType) => void

  onEdit:
    (routine: RoutineItemType) => void

  onMoveUp:
    (routineId: number) => void

  onMoveDown:
    (routineId: number) => void

  onAutoArrange:
    (type: RoutineType) => void
}


function RoutineList({
  title,
  type,
  routines,
  onAdd,
  onEdit,
  onMoveUp,
  onMoveDown,
  onAutoArrange,
}: Props) {
  const displayedRoutines =
    routines
      .filter(
        (routine) =>
          routine.type === type
      )
      .sort(
        (first, second) =>
          first.order - second.order
      )

  return (
    <section className="routine-list-section">
      <div className="routine-list-header">
        <div>
          <h2>{title}</h2>
          <p>
            基本時刻と所要時間を設定します。
          </p>
        </div>

        <div className="routine-list-header-actions">
          <button
            type="button"
            className="routine-secondary-button"
            onClick={() =>
              onAutoArrange(type)
            }
          >
            所要時間で自動配置
          </button>

          <button
            type="button"
            className="routine-add-button"
            onClick={() =>
              onAdd(type)
            }
          >
            ＋ 追加
          </button>
        </div>
      </div>

      <div className="routine-list">
        {displayedRoutines.length === 0 ? (
          <div className="routine-empty">
            <p>
              ルーティンはありません。
            </p>
          </div>
        ) : (
          displayedRoutines.map(
            (routine, index) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                isFirst={index === 0}
                isLast={
                  index ===
                  displayedRoutines.length - 1
                }
                onEdit={onEdit}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            )
          )
        )}
      </div>
    </section>
  )
}

export default RoutineList
