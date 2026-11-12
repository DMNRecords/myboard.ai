import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

import { updatePasswordAction } from "./actions";

const messages: Record<string, string> = {
  invalid_password:
    "Пароль должен содержать не менее 12 символов, а оба значения должны совпадать.",
  update_failed: "Не удалось обновить пароль. Запросите новую ссылку восстановления."
};

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  if (!(await getCurrentUser())) {
    redirect("/login?message=confirm_failed");
  }

  const { message } = await searchParams;
  const notice = typeof message === "string" ? messages[message] : undefined;

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        MYBOARD.AI
      </Link>
      <section className="auth-card" aria-labelledby="update-password-title">
        <span className="eyebrow">Восстановление доступа</span>
        <h1 id="update-password-title">Новый пароль</h1>
        <p>Выберите новый пароль длиной не менее 12 символов.</p>
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
        <form action={updatePasswordAction} className="auth-form">
          <label>
            Новый пароль
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <label>
            Повторите пароль
            <input
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <button className="cta" type="submit">
            Обновить пароль
          </button>
        </form>
      </section>
    </main>
  );
}
