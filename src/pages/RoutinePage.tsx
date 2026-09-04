/* ========================================

ルーティン設定画面

・朝 / 夜ルーティン
・基本時刻
・所要時間
・追加 / 編集 / 削除
・並び替え
・基本時刻の自動配置
・明日の予定調整

======================================== */

import {
  useState,
} from 'react'

import type {
  RoutineItem,
  RoutineType,
} from '../types/routine'

import RoutineList from '../components/RoutineList'
import RoutineModal from '../components/RoutineModal'

import {
  minutesToTimeString,
  timeStringToMinutes,
} from '../utils/time'


type Props = {
  routines: RoutineItem[]

  onRoutinesChange:
    (routines: RoutineItem[]) => void

  onOpenTomorrowAdjust:
    () => void
}


function RoutinePage({
  routines,
  onRoutinesChange,
  onOpenTomorrowAdjust,
}: Props) {
  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [editingRoutine, setEditingRoutine] =
    useState<RoutineItem | null>(
      null
    )

  const [defaultType, setDefaultType] =
    useState<RoutineType>(
      'morning'
    )


  /* ========================================

  orderを朝・夜ごとに振り直す

  ======================================== */

  const normalizeOrders = (
    items: RoutineItem[]
  ) => {
    const normalize = (
      type: RoutineType
    ) =>
      items
        .filter(
          (item) =>
            item.type === type
        )
        .sort(
          (first, second) =>
            first.order - second.order
        )
        .map(
          (item, index) => ({
            ...item,
            order: index + 1,
          })
        )

    return [
      ...normalize('morning'),
      ...normalize('evening'),
    ]
  }


  /* ========================================

  新規追加

  ======================================== */

  const openAddRoutine = (
    type: RoutineType
  ) => {
    setEditingRoutine(null)
    setDefaultType(type)
    setIsModalOpen(true)
  }


  /* ========================================

  編集

  ======================================== */

  const openEditRoutine = (
    routine: RoutineItem
  ) => {
    setEditingRoutine(routine)
    setDefaultType(routine.type)
    setIsModalOpen(true)
  }


  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRoutine(null)
  }


  /* ========================================

  保存

  ======================================== */

  const saveRoutine = (
    values: {
      title: string
      type: RoutineType
      defaultTime: string | null
      durationMinutes: number
    }
  ) => {
    if (!editingRoutine) {
      const sameTypeCount =
        routines.filter(
          (routine) =>
            routine.type === values.type
        ).length

      const newRoutine:
        RoutineItem = {
        id: Date.now(),
        title: values.title,
        type: values.type,
        order: sameTypeCount + 1,
        defaultTime:
          values.defaultTime,
        durationMinutes:
          values.durationMinutes,
      }

      onRoutinesChange(
        normalizeOrders([
          ...routines,
          newRoutine,
        ])
      )

      closeModal()
      return
    }

    const typeChanged =
      editingRoutine.type !==
      values.type

    const nextOrder =
      routines.filter(
        (routine) =>
          routine.type === values.type
      ).length + 1

    const updated =
      routines.map(
        (routine) =>
          routine.id ===
          editingRoutine.id
            ? {
                ...routine,
                ...values,
                order: typeChanged
                  ? nextOrder
                  : routine.order,
              }
            : routine
      )

    onRoutinesChange(
      normalizeOrders(updated)
    )

    closeModal()
  }


  /* ========================================

  削除

  ======================================== */

  const deleteRoutine = () => {
    if (!editingRoutine) {
      return
    }

    const confirmed =
      window.confirm(
        'このルーティンを削除しますか？'
      )

    if (!confirmed) {
      return
    }

    onRoutinesChange(
      normalizeOrders(
        routines.filter(
          (routine) =>
            routine.id !==
            editingRoutine.id
        )
      )
    )

    closeModal()
  }


  /* ========================================

  上下移動

  ======================================== */

  const moveRoutine = (
    routineId: number,
    direction: -1 | 1
  ) => {
    const target =
      routines.find(
        (routine) =>
          routine.id === routineId
      )

    if (!target) {
      return
    }

    const group =
      routines
        .filter(
          (routine) =>
            routine.type === target.type
        )
        .sort(
          (first, second) =>
            first.order - second.order
        )

    const index =
      group.findIndex(
        (routine) =>
          routine.id === routineId
      )

    const swapIndex =
      index + direction

    if (
      index === -1 ||
      swapIndex < 0 ||
      swapIndex >= group.length
    ) {
      return
    }

    const swap = group[swapIndex]

    onRoutinesChange(
      routines.map(
        (routine) => {
          if (routine.id === target.id) {
            return {
              ...routine,
              order: swap.order,
            }
          }

          if (routine.id === swap.id) {
            return {
              ...routine,
              order: target.order,
            }
          }

          return routine
        }
      )
    )
  }


  /* ========================================

  基本時刻を所要時間から自動配置

  最初のルーティンの基本時刻を基準にする

  ======================================== */

  const autoArrangeDefaults = (
    type: RoutineType
  ) => {
    const group =
      routines
        .filter(
          (routine) =>
            routine.type === type
        )
        .sort(
          (first, second) =>
            first.order - second.order
        )

    if (group.length === 0) {
      return
    }

    const firstTime =
      group[0].defaultTime

    if (!firstTime) {
      alert(
        '最初のルーティンに基本時刻を設定してください'
      )
      return
    }

    let currentMinutes =
      timeStringToMinutes(
        firstTime
      )

    if (currentMinutes === null) {
      return
    }

    const timeMap =
      new Map<number, string>()

    group.forEach(
      (routine) => {
        timeMap.set(
          routine.id,
          minutesToTimeString(
            currentMinutes as number
          )
        )

        currentMinutes =
          Math.min(
            23 * 60 + 59,
            (currentMinutes as number) +
              routine.durationMinutes
          )
      }
    )

    onRoutinesChange(
      routines.map(
        (routine) => ({
          ...routine,
          defaultTime:
            timeMap.get(routine.id) ??
            routine.defaultTime,
        })
      )
    )
  }


  return (
    <div className="routine-page">
      <header className="routine-page-header">
        <div>
          <p className="eyebrow">
            Routine
          </p>

          <h1>
            ルーティン設定
          </h1>

          <p>
            普段使う基本時刻と所要時間を設定します。
          </p>
        </div>

        <button
          type="button"
          className="routine-add-button"
          onClick={onOpenTomorrowAdjust}
        >
          明日の予定を調整
        </button>
      </header>

      <RoutineList
        title="朝ルーティン"
        type="morning"
        routines={routines}
        onAdd={openAddRoutine}
        onEdit={openEditRoutine}
        onMoveUp={(routineId) =>
          moveRoutine(
            routineId,
            -1
          )
        }
        onMoveDown={(routineId) =>
          moveRoutine(
            routineId,
            1
          )
        }
        onAutoArrange={
          autoArrangeDefaults
        }
      />

      <RoutineList
        title="夜ルーティン"
        type="evening"
        routines={routines}
        onAdd={openAddRoutine}
        onEdit={openEditRoutine}
        onMoveUp={(routineId) =>
          moveRoutine(
            routineId,
            -1
          )
        }
        onMoveDown={(routineId) =>
          moveRoutine(
            routineId,
            1
          )
        }
        onAutoArrange={
          autoArrangeDefaults
        }
      />

      <RoutineModal
        isOpen={isModalOpen}
        routine={editingRoutine}
        defaultType={defaultType}
        onClose={closeModal}
        onSave={saveRoutine}
        onDelete={deleteRoutine}
      />
    </div>
  )
}

export default RoutinePage
