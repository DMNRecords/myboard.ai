import { expect, test } from "@playwright/test";

test("renders the MYBOARD.AI application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("MYBOARD.AI");
  await expect(
    page.getByRole("heading", {
      name: "Расскажите историю. Мы поможем превратить её в игру."
    })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Создать игру" })).toHaveAttribute("href", "/login");
});

test("renders the login page for the current Supabase configuration", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Войдите или создайте аккаунт" })).toBeVisible();
  const signInButton = page.getByRole("button", { name: "Войти" });

  if (await signInButton.isDisabled()) {
    await expect(page.getByRole("status")).toContainText(".env.local");
  } else {
    await expect(page.getByRole("textbox", { name: "Email" })).toBeEnabled();
    await expect(signInButton).toBeEnabled();
  }
});

test("redirects anonymous visitors from projects to login", async ({ page }) => {
  await page.goto("/projects");

  await expect(page).toHaveURL(/\/login$/);
});
