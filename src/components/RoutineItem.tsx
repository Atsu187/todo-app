/* ========================================

ルーティン設定画面
ルーティン1項目

======================================== */

import type {
  RoutineItem as RoutineItemType,
} from '../types/routine'


type Props = {
  routine: RoutineItemType

  isFirst: boolean

  isLast: boolean

  onEdit:
    (routine: RoutineItemType) => void

  onMoveUp:
    (routineId: number) => void

  onMoveDown:
    (routineId: number) => void
}


function RoutineItem({
  routine,
  isFirst,
  isLast,
  onEdit,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <div className="routine-item">

      {/* ========================================

      順番

      ======================================== */}

      <div className="routine-item-order">
        {routine.order}
      </div>


      {/* ========================================

      内容

      ======================================== */}

      <div className="routine-item-content">
        <strong>
          {routine.title}
        </strong>

        <div className="routine-item-meta">
          <span>
            基本時刻：
            {routine.defaultTime ?? '時間なし'}
          </span>

          <span>
            所要時間：
            {routine.durationMinutes}分
          </span>
        </div>
      </div>


      {/* ========================================

      操作

      ======================================== */}

      <div className="routine-item-actions">
        <button
          type="button"
          className="routine-order-button"
          disabled={isFirst}
          onClick={() =>
            onMoveUp(routine.id)
          }
        >
          ↑
        </button>

        <button
          type="button"
          className="routine-order-button"
          disabled={isLast}
          onClick={() =>
            onMoveDown(routine.id)
          }
        >
          ↓
        </button>

        <button
          type="button"
          className="routine-edit-button"
          onClick={() =>
            onEdit(routine)
          }
        >
          編集
        </button>
      </div>
    </div>
  )
}

export default RoutineItem
