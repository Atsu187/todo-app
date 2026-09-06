/* ========================================

ログイン画面

Supabase Authenticationを使って
メールアドレスとパスワードでログインする

======================================== */

import {
  useState,
  type FormEvent,
} from 'react'

import {
  supabase,
} from '../services/supabase'


function LoginPage() {
  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [isSubmitting, setIsSubmitting] =
    useState(false)


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setErrorMessage('')
    setIsSubmitting(true)

    const {
      error,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(
        'メールアドレスまたはパスワードを確認してください。'
      )

      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
  }


  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-title-area">
          <p className="login-eyebrow">
            TODO APP
          </p>

          <h1>
            ログイン
          </h1>

          <p className="login-description">
            Supabaseに登録したアカウントでログインしてください。
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label className="login-field">
            <span>
              メールアドレス
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              placeholder="example@email.com"
              required
            />
          </label>

          <label className="login-field">
            <span>
              パスワード
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              placeholder="パスワード"
              required
            />
          </label>

          {errorMessage && (
            <p className="login-error-message">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="login-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'ログイン中...'
              : 'ログイン'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
