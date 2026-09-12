/* ========================================

タスク追加・編集モーダル

・最小10分
・10分単位
・開始時刻
・終了時刻
・期限
・優先度
・メモ

======================================== */

import type {
  Priority,
  TaskId,
} from '../types/task'

import type {
  TaskCategory,
} from '../types/category'


type Props = {
  isOpen: boolean

  editingTaskId:
    TaskId | null

  title: string

  categoryId: string

  categories: TaskCategory[]

  taskDate: string

  taskDateFallback: string

  durationMinutes: number

  priority: Priority

  hasDeadline: boolean

  dueDate: string

  startTime: string

  endTime: string

  memo: string

  setTitle:
    (value: string) => void

  setCategoryId:
    (value: string) => void

  setTaskDate:
    (value: string) => void

  setPriority:
    (value: Priority) => void

  setHasDeadline:
    (value: boolean) => void

  setDueDate:
    (value: string) => void

  setMemo:
    (value: string) => void

  onDurationChange:
    (value: number) => void

  onStartTimeChange:
    (value: string) => void

  onEndTimeChange:
    (value: string) => void

  onClose: () => void

  onSave: () => void

  onDelete: () => void
}


function TaskModal({
  isOpen,
  editingTaskId,
  title,
  categoryId,
  categories,
  taskDate,
  taskDateFallback,
  durationMinutes,
  priority,
  hasDeadline,
  dueDate,
  startTime,
  endTime,
  memo,
  setTitle,
  setCategoryId,
  setTaskDate,
  setPriority,
  setHasDeadline,
  setDueDate,
  setMemo,
  onDurationChange,
  onStartTimeChange,
  onEndTimeChange,
  onClose,
  onSave,
  onDelete,
}: Props) {

  if (!isOpen) {
    return null
  }


/* ========================================

予定時間の選択肢

10分〜60分
→ 5分刻み

60分超〜180分
→ 30分刻み

======================================== */

const durationOptions = [
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
]

  const hasCustomDuration =
    !durationOptions.includes(
      durationMinutes
    )

  const isEditing =
    editingTaskId !== null


  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >

      <div className="task-modal">


        {/* ========================================

        ヘッダー

        ======================================== */}

        <div className="modal-header">

          <div>

            <p className="modal-eyebrow">
              {isEditing
                ? 'Edit Task'
                : 'New Task'}
            </p>

            <h2>
              {isEditing
                ? 'タスクを編集'
                : 'タスクを追加'}
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

        タスク名

        ======================================== */}

        <div className="form-group">

          <label>
            タスク名

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
            placeholder="例：論文確認"
            autoFocus
          />

        </div>


        {/* ========================================

        カテゴリ

        ======================================== */}

        <div className="form-group">

          <label>
            カテゴリ
          </label>

          <select
            value={categoryId}
            onChange={(event) =>
              setCategoryId(
                event.target.value
              )
            }
          >
            <option value="">
              カテゴリなし
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          <p className="form-help">
            カテゴリは「設定」から追加・削除できます。
          </p>

        </div>


        {/* ========================================

        期限

        「いつまでに終わらせるか」

        タスク管理で使用

        ======================================== */}

        <div className="form-group">

          <label>
            期限
          </label>

          <div className="deadline-options">

            <label className="radio-option">

              <input
                type="radio"
                name="deadline"
                checked={hasDeadline}
                onChange={() =>
                  setHasDeadline(true)
                }
              />

              <span>
                日付を指定
              </span>

            </label>

            <label className="radio-option">

              <input
                type="radio"
                name="deadline"
                checked={!hasDeadline}
                onChange={() => {
                  setHasDeadline(false)
                  setDueDate('')
                }}
              />

              <span>
                期限なし
              </span>

            </label>

          </div>

          {hasDeadline && (

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
            />

          )}

        </div>


        {/* ========================================

        予定時間

        ======================================== */}

        <div className="form-group">

          <label>
            予定時間

            <span className="required">
              *
            </span>
          </label>

          <select
            value={durationMinutes}
            onChange={(event) =>
              onDurationChange(
                Number(
                  event.target.value
                )
              )
            }
          >

            {hasCustomDuration && (
              <option
                value={durationMinutes}
              >
                {durationMinutes}分
              </option>
            )}

            {durationOptions.map(
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

        優先度

        ======================================== */}

        <div className="form-group">

          <label>
            優先度

            <span className="required">
              *
            </span>
          </label>

          <div className="priority-selector">

            {(
              [
                '低',
                '中',
                '高',
              ] as Priority[]
            ).map(
              (priorityValue) => (

                <button
                  key={priorityValue}
                  type="button"
                  className={[
                    'priority-option',

                    priority ===
                    priorityValue
                      ? 'selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  }
                  onClick={() =>
                    setPriority(
                      priorityValue
                    )
                  }
                >
                  {priorityValue}
                </button>

              )
            )}

          </div>

        </div>


        {/* ========================================

        実行日

        「いつ行うか」

        日付なしも選択可能

        ======================================== */}

        <div className="form-group">

          <label>
            いつ行う？
          </label>

          <div className="deadline-options">

            <label className="radio-option">

              <input
                type="radio"
                name="task-date"
                checked={Boolean(taskDate)}
                onChange={() =>
                  setTaskDate(
                    taskDate ||
                    taskDateFallback
                  )
                }
              />

              <span>
                日付を指定
              </span>

            </label>

            <label className="radio-option">

              <input
                type="radio"
                name="task-date"
                checked={!taskDate}
                onChange={() => {
                  setTaskDate('')
                  onStartTimeChange('')
                }}
              />

              <span>
                日付なし
              </span>

            </label>

          </div>

          {taskDate && (

            <input
              type="date"
              value={taskDate}
              onChange={(event) =>
                setTaskDate(
                  event.target.value
                )
              }
            />

          )}

          <p className="form-help">
            日付を指定すると、その日のToday・タイムラインに表示されます。
            日付なしの場合は「未完了のToDo」に表示されます。
          </p>

        </div>


        {/* ========================================

        開始時刻・終了時刻

        10分単位

        ======================================== */}

        <div className="time-form-row">

          <div className="form-group">

            <label>
              開始時刻
            </label>

            <input
              type="time"
              step={600}
              value={startTime}
              disabled={!taskDate}
              onChange={(event) =>
                onStartTimeChange(
                  event.target.value
                )
              }
            />

          </div>

          <div className="time-arrow">
            →
          </div>

          <div className="form-group">

            <label>
              終了時刻
            </label>

            <input
              type="time"
              step={600}
              value={endTime}
              disabled={
                !taskDate ||
                !startTime
              }
              onChange={(event) =>
                onEndTimeChange(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        <p className="form-help time-help">
          日付なしの場合は時刻を設定できません。
          日付を指定した場合、時刻は10分単位で設定します。
          開始時刻を入力すると、予定時間から終了時刻を自動計算します。
        </p>


        {/* ========================================

        メモ

        ======================================== */}

        <div className="form-group">

          <label>
            メモ
          </label>

          <textarea
            value={memo}
            onChange={(event) =>
              setMemo(
                event.target.value
              )
            }
            placeholder="必要に応じてメモを入力"
            rows={4}
          />

        </div>


        {/* ========================================

        表示先

        ======================================== */}

        <div className="schedule-note">

          {startTime ? (

            <>
              <strong>
                {taskDate || '指定日'}のタイムラインに追加
              </strong>

              <span>
                開始時刻が設定されているため、
                指定日のタイムラインに表示されます。
              </span>
            </>

          ) : (

            <>
              <strong>
                {taskDate || '指定日'}のToDoリストに追加
              </strong>

              <span>
                開始時刻が未設定のため、
                指定日のToDoリストに表示されます。
              </span>
            </>

          )}

        </div>


        {/* ========================================

        下部ボタン

        ======================================== */}

        <div className="modal-footer">

          {isEditing ? (

            <button
              type="button"
              className="delete-button"
              onClick={onDelete}
            >
              タスクを削除
            </button>

          ) : (

            <div />

          )}

          <div className="modal-actions">

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
              onClick={onSave}
            >
              {isEditing
                ? '変更を保存'
                : 'タスクを追加'}
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}


export default TaskModal