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
    (name: string, color: string) => Promise<void>

  onUpdateCategory:
    (id: string, name: string, color: string) => Promise<void>

  onDeleteCategory:
    (categoryId: string) => Promise<void>
}


function SettingsPage({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: Props) {

  const [categoryName, setCategoryName] =
    useState('')

  const [newColor, setNewColor] = useState('#64748b')
  const [drafts, setDrafts] = useState<Record<string, {name: string; color: string}>>({})

  const [message, setMessage] =
    useState('')


  const addCategory = async () => {
    const name =
      categoryName.trim()

    if (!name) {
      return
    }

    try {
      await onAddCategory(name, newColor)
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

          <input type="color" aria-label="新しいカテゴリの色" value={newColor} onChange={(event) => setNewColor(event.target.value)} />
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
                <input type="color" aria-label={`${category.name}の色`} value={drafts[category.id]?.color ?? category.color ?? '#64748b'} onChange={(event) => setDrafts((current) => ({...current, [category.id]: {name: current[category.id]?.name ?? category.name, color: event.target.value}}))} />
                <input type="text" aria-label="カテゴリ名" value={drafts[category.id]?.name ?? category.name} onChange={(event) => setDrafts((current) => ({...current, [category.id]: {name: event.target.value, color: current[category.id]?.color ?? category.color ?? '#64748b'}}))} />
                <button type="button" className="secondary-action-button" onClick={async () => {
                  const draft = drafts[category.id]
                  if (!draft) return
                  if (!draft.name.trim()) { setMessage('カテゴリ名を入力してください。'); return }
                  try {
                    await onUpdateCategory(category.id, draft.name, draft.color)
                    setDrafts((current) => { const next = {...current}; delete next[category.id]; return next })
                    setMessage('カテゴリを更新しました。')
                  } catch (error) { setMessage(error instanceof Error ? error.message : '更新に失敗しました。') }
                }}>保存</button>
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
