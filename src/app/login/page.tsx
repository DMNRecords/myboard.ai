import Link from "next/link";

import { hasSupabasePublicConfig } from "@/lib/env";

import { signInAction, signUpAction } from "./actions";

const messages: Record<string, string> = {
  check_email: "Проверьте почту и подтвердите регистрацию по ссылке.",
  confirm_failed: "Не удалось подтвердить email. Запросите новую ссылку регистрации.",
  invalid_credentials: "Проверьте email и пароль: пароль должен содержать не менее 12 символов.",
  invalid_reset_email: "Укажите корректный email.",
  reset_email_sent: "Если аккаунт существует, ссылка для сброса уже отправлена на email.",
  reset_unavailable: "Восстановление пароля сейчас недоступно. Повторите попытку позже.",
  signup_unavailable: "Регистрация сейчас недоступна. Повторите попытку позже.",
  supabase_not_configured: "Вход будет доступен после подключения Supabase-проекта."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const { message } = await searchParams;
  const configurationReady = hasSupabasePublicConfig();
  const notice = typeof message === "string" ? messages[message] : undefined;

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        MYBOARD.AI
      </Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="eyebrow">Ваши проекты</span>
        <h1 id="auth-title">Войдите или создайте аккаунт</h1>
        <p>Сохраняйте идеи игр и возвращайтесь к ним в любой момент.</p>
        {!configurationReady ? (
          <p className="notice" role="status">
            Вход появится после настройки Supabase в <code>.env.local</code>.
          </p>
        ) : null}
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
        <form className="auth-form">
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
          <label>
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={12}
              required
              disabled={!configurationReady}
            />
          </label>
          <div className="auth-actions">
            <button className="cta" formAction={signInAction} disabled={!configurationReady}>
              Войти
            </button>
            <button
              className="secondary-button"
              formAction={signUpAction}
              disabled={!configurationReady}
            >
              Создать аккаунт
            </button>
          </div>
        </form>
        <Link className="text-button" href="/password-reset">
          Забыли пароль?
        </Link>
      </section>
    </main>
  );
}
