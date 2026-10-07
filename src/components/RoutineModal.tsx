/* ========================================

ルーティン追加・編集モーダル

・名前
・朝 / 夜
・基本時刻
・所要時間

時間は10分単位
最小所要時間は10分

======================================== */

import {
  useEffect,
  useState,
} from 'react'

import type {
  RoutineItem,
  RoutineType,
} from '../types/routine'


type Props = {
  isOpen: boolean

  routine: RoutineItem | null

  defaultType: RoutineType

  onClose: () => void

  onSave: (
    values: {
      title: string
      type: RoutineType
      defaultTime: string | null
      durationMinutes: number
    }
  ) => void

  onDelete: () => void
}


function RoutineModal({
  isOpen,
  routine,
  defaultType,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [
    title,
    setTitle,
  ] = useState('')

  const [
    type,
    setType,
  ] = useState<RoutineType>(
    defaultType
  )

  const [
    defaultTime,
    setDefaultTime,
  ] = useState('')

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState(10)


  /* ========================================

  モーダルを開いた時の初期値

  ======================================== */

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (routine) {
      setTitle(
        routine.title
      )

      setType(
        routine.type
      )

      setDefaultTime(
        routine.defaultTime ?? ''
      )

      setDurationMinutes(
        routine.durationMinutes
      )

      return
    }

    setTitle('')
    setType(defaultType)
    setDefaultTime('')
    setDurationMinutes(10)
  }, [
    isOpen,
    routine,
    defaultType,
  ])


  if (!isOpen) {
    return null
  }


  /* ========================================

  保存

  ======================================== */

  const handleSave = () => {
    if (!title.trim()) {
      alert(
        'ルーティン名を入力してください'
      )

      return
    }

    if (
      durationMinutes < 10
    ) {
      alert(
        '所要時間は10分以上にしてください'
      )

      return
    }

    onSave({
      title:
        title.trim(),

      type,

      defaultTime:
        defaultTime || null,

      durationMinutes,
    })
  }


  return (
    <div className="modal-overlay">

      <div className="routine-modal">

        {/* ========================================

        ヘッダー

        ======================================== */}

        <div className="routine-modal-header">

          <div>

            <p className="eyebrow">
              Routine
            </p>

            <h2>
              {routine
                ? 'ルーティンを編集'
                : 'ルーティンを追加'}
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


        {/* ========================================

        ルーティン名

        ======================================== */}

        <div className="routine-form-group">

          <label>
            ルーティン名

            <span className="required">
              *
            </span>
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="例：ストレッチ"
          />

        </div>


        {/* ========================================

        朝 / 夜

        ======================================== */}

        <div className="routine-form-group">

          <span className="routine-form-label">
            種類
          </span>

          <div className="routine-type-buttons">

            <button
              type="button"
              className={
                type === 'morning'
                  ? 'routine-type-button active'
                  : 'routine-type-button'
              }
              onClick={() =>
                setType(
                  'morning'
                )
              }
            >
              朝
            </button>

            <button
              type="button"
              className={
                type === 'evening'
                  ? 'routine-type-button active'
                  : 'routine-type-button'
              }
              onClick={() =>
                setType(
                  'evening'
                )
              }
            >
              夜
            </button>

          </div>

        </div>


        {/* ========================================

        基本時刻

        ======================================== */}

        <div className="routine-form-group">

          <label>
            基本時刻
          </label>

          <input
            type="time"
            step={600}
            value={defaultTime}
            onChange={(event) =>
              setDefaultTime(
                event.target.value
              )
            }
          />

          <button
            type="button"
            className="routine-text-button"
            onClick={() =>
              setDefaultTime('')
            }
          >
            時間なしにする
          </button>

          <p className="routine-modal-note">
            日別変更がない日は、この時刻でTodayに表示します。
            時間なしの場合はTodayのToDo側に表示します。
          </p>

        </div>


        {/* ========================================

所要時間

10分〜60分
→ 5分刻み

60分超〜180分
→ 30分刻み

======================================== */}

<div className="routine-form-group">

  <label>
    所要時間

    <span className="required">
      *
    </span>
  </label>

  <select
    value={durationMinutes}
    onChange={(event) =>
      setDurationMinutes(
        Number(
          event.target.value
        )
      )
    }
  >

    {[
      10,
      15,
      20,
      25,
      30,
      35,
      40,
      45,
      50,
      55,
      60,
      90,
      120,
      150,
      180,
    ].map(
      (minutes) => (
        <option
          key={minutes}
          value={minutes}
        >
          {minutes}分
        </option>
      )
    )}

  </select>

</div>


        {/* ========================================

        下部ボタン

        ======================================== */}

        <div className="routine-modal-footer">

          {routine ? (
            <button
              type="button"
              className="routine-delete-button"
              onClick={onDelete}
            >
              削除
            </button>
          ) : (
            <span />
          )}

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
              保存
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}


export default RoutineModal