/* ========================================

全タスク管理ページ

・期限フィルター
・優先度フィルター
・カテゴリフィルター

======================================== */

import {
  useMemo,
  useState,
} from 'react'

import type {
  Priority,
  Task,
  TaskId,
} from '../types/task'

import type {
  TaskCategory,
} from '../types/category'

import {
  addDaysToDateKey,
  formatMonthDay,
  getLocalDateKey,
} from '../utils/date'

import {
  formatTime,
} from '../utils/time'


type Filter =
  | 'today'
  | 'tomorrow'
  | 'week'
  | 'overdue'
  | 'incomplete'
  | 'completed'
  | 'priority'


type Props = {
  tasks: Task[]

  categories: TaskCategory[]

  now: Date

  onAddTask: () => void

  onEditTask:
    (task: Task) => void

  onToggleComplete:
    (taskId: TaskId) => void

  onOpenDate:
    (date: string) => void

}


function TasksPage({
  tasks,
  categories,
  now,
  onAddTask,
  onEditTask,
  onToggleComplete,
  onOpenDate,
}: Props) {

  const [filter, setFilter] =
    useState<Filter>('today')

  const [priority, setPriority] =
    useState<Priority>('高')

  const [categoryFilter, setCategoryFilter] =
    useState('all')

  const today =
    getLocalDateKey(now)

  const tomorrow =
    addDaysToDateKey(
      today,
      1
    )

  const weekEnd =
    addDaysToDateKey(
      today,
      6
    )


  const categoryMap =
    useMemo(
      () =>
        new Map(
          categories.map(
            (category) => [
              category.id,
              category.name,
            ]
          )
        ),
      [categories]
    )


  /* ========================================

  タスク絞り込み

  ======================================== */

  const filteredTasks =
    useMemo(
      () => {
        const result =
          tasks.filter(
            (task) => {
              const categoryMatches =
                categoryFilter === 'all' ||
                (
                  categoryFilter === 'none'
                    ? !task.categoryId
                    : task.categoryId === categoryFilter
                )

              if (!categoryMatches) {
                return false
              }

              switch (filter) {
                case 'today':
                  return (
                    !task.completed &&
                    task.dueDate !== null &&
                    task.dueDate <= tomorrow
                  )

                case 'tomorrow':
                  return (
                    !task.completed &&
                    task.dueDate === tomorrow
                  )

                case 'week':
                  return (
                    !task.completed &&
                    task.dueDate !== null &&
                    task.dueDate >= today &&
                    task.dueDate <= weekEnd
                  )

                case 'overdue':
                  return (
                    !task.completed &&
                    task.dueDate !== null &&
                    task.dueDate < today
                  )

                case 'incomplete':
                  return !task.completed

                case 'completed':
                  return task.completed

                case 'priority':
                  return task.priority === priority
              }
            }
          )

        return [...result]
          .sort(
            (first, second) => {
              const firstDueDate =
                first.dueDate ?? '9999-12-31'

              const secondDueDate =
                second.dueDate ?? '9999-12-31'

              const dueCompare =
                firstDueDate.localeCompare(
                  secondDueDate
                )

              if (dueCompare !== 0) {
                return dueCompare
              }

              const firstTaskDate =
                first.taskDate || '9999-12-31'

              const secondTaskDate =
                second.taskDate || '9999-12-31'

              const dateCompare =
                firstTaskDate.localeCompare(
                  secondTaskDate
                )

              if (dateCompare !== 0) {
                return dateCompare
              }

              const firstMinutes =
                first.startHour === null ||
                first.startMinute === null
                  ? Number.MAX_SAFE_INTEGER
                  : first.startHour * 60 +
                    first.startMinute

              const secondMinutes =
                second.startHour === null ||
                second.startMinute === null
                  ? Number.MAX_SAFE_INTEGER
                  : second.startHour * 60 +
                    second.startMinute

              return firstMinutes - secondMinutes
            }
          )
      },
      [
        tasks,
        filter,
        priority,
        categoryFilter,
        today,
        tomorrow,
        weekEnd,
      ]
    )


  const filters:
    Array<{
      value: Filter
      label: string
    }> = [
      { value: 'today', label: '今日' },
      { value: 'tomorrow', label: '明日' },
      { value: 'week', label: '今週' },
      { value: 'overdue', label: '期限切れ' },
      { value: 'incomplete', label: '未完了' },
      { value: 'completed', label: '完了' },
      { value: 'priority', label: '優先度' },
    ]


  return (
    <div className="tasks-page">

      <div className="tasks-page-header">
        <div>
          <p className="eyebrow">
            Tasks
          </p>

          <h1>
            タスク管理
          </h1>
        </div>

        <div className="tasks-page-header-actions">
          <button
            type="button"
            className="add-button"
            onClick={onAddTask}
          >
            ＋ タスクを追加
          </button>
        </div>
      </div>


      <div className="task-filter-bar">
        {filters.map(
          (item) => (
            <button
              type="button"
              key={item.value}
              className={
                filter === item.value
                  ? 'task-filter-button active'
                  : 'task-filter-button'
              }
              onClick={() =>
                setFilter(item.value)
              }
            >
              {item.label}
            </button>
          )
        )}

        {filter === 'priority' && (
          <select
            className="priority-filter-select"
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value as Priority
              )
            }
          >
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        )}

        <select
          className="priority-filter-select"
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            すべてのカテゴリ
          </option>

          <option value="none">
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
      </div>


      <div style={{ marginBottom: '12px' }}>
        <span className="tasks-count">
          {filteredTasks.length}件
        </span>
      </div>


      <div className="task-management-list">
        {filteredTasks.map(
          (task) => {
            const timeText =
              task.startHour !== null &&
              task.startMinute !== null
                ? formatTime(
                    task.startHour,
                    task.startMinute
                  )
                : '時刻未設定'

            const isOverdue =
              !task.completed &&
              task.dueDate !== null &&
              task.dueDate < today

            const isDueToday =
              !task.completed &&
              task.dueDate === today

            const isDueTomorrow =
              !task.completed &&
              task.dueDate === tomorrow

            let dueText =
              task.dueDate
                ? formatMonthDay(task.dueDate)
                : 'なし'

            if (isOverdue) {
              dueText = `期限切れ ${dueText}`
            } else if (isDueToday) {
              dueText = `今日 ${dueText}`
            } else if (isDueTomorrow) {
              dueText = `明日 ${dueText}`
            }

            const categoryName =
              task.categoryId
                ? categoryMap.get(task.categoryId) ?? '削除済み'
                : 'なし'

            return (
              <div
                className={[
                  'task-management-row',
                  task.completed
                    ? 'completed'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={task.id}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() =>
                    onToggleComplete(task.id)
                  }
                />

                <button
                  type="button"
                  className="task-management-main"
                  onClick={() =>
                    onEditTask(task)
                  }
                >
                  <strong>
                    {task.title}
                  </strong>

                  <span>
                    実行日：
                    {
                      task.taskDate
                        ? formatMonthDay(task.taskDate)
                        : '日付なし'
                    }
                    {' ・ '}
                    {timeText}
                    {' ・ '}
                    {task.durationMinutes}分
                    {' ・ '}
                    カテゴリ：{categoryName}
                  </span>
                </button>

                <span className="task-management-deadline">
                  期限：{dueText}
                </span>

                <span className="task-management-priority">
                  優先度：{task.priority}
                </span>

                <button
                  type="button"
                  className="task-open-date-button"
                  disabled={!task.taskDate}
                  onClick={() => {
                    if (task.taskDate) {
                      onOpenDate(task.taskDate)
                    }
                  }}
                >
                  {
                    task.taskDate
                      ? '実行日を開く'
                      : '日付なし'
                  }
                </button>
              </div>
            )
          }
        )}

        {filteredTasks.length === 0 && (
          <div className="task-management-empty">
            該当するタスクはありません。
          </div>
        )}
      </div>
    </div>
  )
}

export default TasksPage
