import Link from "next/link";

import { hasSupabasePublicConfig } from "@/lib/env";

import { requestPasswordResetAction } from "../login/actions";

export default function PasswordResetPage() {
  const configurationReady = hasSupabasePublicConfig();

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        MYBOARD.AI
      </Link>
      <section className="auth-card" aria-labelledby="reset-title">
        <span className="eyebrow">Восстановление доступа</span>
        <h1 id="reset-title">Сбросить пароль</h1>
        <p>Мы отправим ссылку для создания нового пароля, если аккаунт с таким email существует.</p>
        {!configurationReady ? (
          <p className="notice" role="status">
            Восстановление станет доступно после настройки Supabase в <code>.env.local</code>.
          </p>
        ) : null}
        <form action={requestPasswordResetAction} className="auth-form">
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={!configurationReady}
            />
          </label>
          <button className="cta" type="submit" disabled={!configurationReady}>
            Отправить ссылку
          </button>
        </form>
        <Link className="text-button" href="/login">
          Вернуться ко входу
        </Link>
      </section>
    </main>
  );
}
