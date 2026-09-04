/* ========================================

アプリのナビゲーション

PC
→ 左サイドバー

スマートフォン
→ 画面下部ナビゲーション

======================================== */

import type {
  AppPage,
} from '../types/page'


/* ========================================

Props

======================================== */

type Props = {
  currentPage:
    AppPage

  onPageChange:
    (
      page: AppPage
    ) => void
}


/* ========================================

メニュー項目

======================================== */

type MenuItem = {
  page:
    AppPage

  label:
    string

  shortLabel:
    string

  icon:
    string
}


const menuItems:
  MenuItem[] = [

    {
      page: 'today',
      label: 'Today',
      shortLabel: 'Today',
      icon: '◉',
    },

    {
      page: 'calendar',
      label: 'カレンダー',
      shortLabel: '予定',
      icon: '▣',
    },

    {
      page: 'tasks',
      label: 'タスク管理',
      shortLabel: 'タスク',
      icon: '✓',
    },

    {
      page: 'routine',
      label: 'ルーティン設定',
      shortLabel: '習慣',
      icon: '↻',
    },

    {
      page: 'googleCalendar',
      label: 'Google Calendar',
      shortLabel: 'Google',
      icon: '▦',
    },

    {
      page: 'settings',
      label: '設定',
      shortLabel: '設定',
      icon: '⚙',
    },

  ]


function Sidebar({
  currentPage,
  onPageChange,
}: Props) {

  return (
    <>

      {/* ========================================

      PC用サイドバー

      ======================================== */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="sidebar-logo-mark">
            T
          </div>

          <div>

            <strong>
              My ToDo
            </strong>

            <span>
              Time Manager
            </span>

          </div>

        </div>


        <nav className="sidebar-navigation">

          {menuItems.map(
            (
              menuItem
            ) => {

              const isActive =
                currentPage ===
                menuItem.page

              return (
                <button
                  type="button"

                  key={
                    menuItem.page
                  }

                  className={
                    isActive
                      ? 'sidebar-menu-item active'
                      : 'sidebar-menu-item'
                  }

                  onClick={() =>
                    onPageChange(
                      menuItem.page
                    )
                  }
                >

                  <span className="sidebar-menu-icon">

                    {
                      menuItem.icon
                    }

                  </span>

                  <span>

                    {
                      menuItem.label
                    }

                  </span>

                </button>
              )
            }
          )}

        </nav>


        <div className="sidebar-footer">

          <span>
            Personal ToDo
          </span>

        </div>

      </aside>


      {/* ========================================

      スマートフォン用
      下部ナビゲーション

      ======================================== */}

      <nav className="mobile-bottom-navigation">

        {menuItems.map(
          (
            menuItem
          ) => {

            const isActive =
              currentPage ===
                menuItem.page

            return (
              <button
                type="button"

                key={
                  menuItem.page
                }

                className={
                  isActive
                    ? 'mobile-nav-item active'
                    : 'mobile-nav-item'
                }

                onClick={() =>
                  onPageChange(
                    menuItem.page
                  )
                }
              >

                <span className="mobile-nav-icon">

                  {
                    menuItem.icon
                  }

                </span>

                <span className="mobile-nav-label">

                  {
                    menuItem.shortLabel
                  }

                </span>

              </button>
            )
          }
        )}

      </nav>

    </>
  )
}


export default Sidebar