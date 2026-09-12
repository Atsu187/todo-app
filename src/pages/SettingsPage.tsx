/* ========================================

設定

カテゴリ管理のみ

======================================== */

import {
  useState,
} from 'react'

import type {
  TaskCategory,
} from '../types/category'


type Props = {
  categories: TaskCategory[]

  onAddCategory:
    (name: string) => Promise<void>

  onDeleteCategory:
    (categoryId: string) => Promise<void>
}


function SettingsPage({
  categories,
  onAddCategory,
  onDeleteCategory,
}: Props) {

  const [categoryName, setCategoryName] =
    useState('')

  const [message, setMessage] =
    useState('')


  const addCategory = async () => {
    const name =
      categoryName.trim()

    if (!name) {
      return
    }

    try {
      await onAddCategory(name)
      setCategoryName('')
      setMessage(
        'カテゴリを追加しました。'
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'カテゴリを追加できませんでした。'
      )
    }
  }


  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <p className="eyebrow">
            Settings
          </p>

          <h1>
            設定
          </h1>

          <p className="settings-description">
            タスクのカテゴリを管理します。
          </p>
        </div>
      </div>

      {message && (
        <div className="settings-message">
          {message}
        </div>
      )}

      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>
              カテゴリ
            </h2>

            <p>
              「研究」「大学」「私用」など、タスクを分類できます。
            </p>
          </div>
        </div>

        <div className="category-create-row">
          <input
            type="text"
            value={categoryName}
            onChange={(event) =>
              setCategoryName(
                event.target.value
              )
            }
            placeholder="例：研究"
          />

          <button
            type="button"
            className="primary-action-button"
            onClick={() => {
              void addCategory()
            }}
          >
            追加
          </button>
        </div>

        <div className="category-settings-list">
          {categories.map(
            (category) => (
              <div
                className="category-settings-row"
                key={category.id}
              >
                <span>
                  {category.name}
                </span>

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={() => {
                    const confirmed =
                      window.confirm(
                        `「${category.name}」を削除しますか？\n既存タスクは「カテゴリなし」になります。`
                      )

                    if (confirmed) {
                      void onDeleteCategory(
                        category.id
                      )
                    }
                  }}
                >
                  削除
                </button>
              </div>
            )
          )}

          {categories.length === 0 && (
            <div className="settings-empty">
              カテゴリはまだありません。
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


export default SettingsPage
