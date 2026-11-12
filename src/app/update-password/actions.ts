"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function updatePasswordAction(formData: FormData) {
  const password = getFormString(formData, "password");
  const passwordConfirmation = getFormString(formData, "passwordConfirmation");

  if (password.length < 12 || password !== passwordConfirmation) {
    redirect("/update-password?message=invalid_password");
  }

  if (!(await getCurrentUser())) {
    redirect("/login?message=confirm_failed");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/update-password?message=update_failed");
  }

  redirect("/projects");
}
