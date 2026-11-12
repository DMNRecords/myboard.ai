"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasSupabasePublicConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function authenticationRedirect(message: string): never {
  redirect(`/login?message=${encodeURIComponent(message)}`);
}

function validateCredentials(formData: FormData): { email: string; password: string } | null {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  if (!email || !email.includes("@") || password.length < 12) {
    return null;
  }

  return { email, password };
}

function isEmail(value: string): boolean {
  return value.includes("@");
}

export async function signInAction(formData: FormData) {
  if (!hasSupabasePublicConfig()) {
    authenticationRedirect("supabase_not_configured");
  }

  const credentials = validateCredentials(formData);

  if (!credentials) {
    authenticationRedirect("invalid_credentials");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    authenticationRedirect("invalid_credentials");
  }

  redirect("/projects");
}

export async function signUpAction(formData: FormData) {
  if (!hasSupabasePublicConfig()) {
    authenticationRedirect("supabase_not_configured");
  }

  const credentials = validateCredentials(formData);

  if (!credentials) {
    authenticationRedirect("invalid_credentials");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (!origin) {
    authenticationRedirect("signup_unavailable");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${origin}/auth/callback` }
  });

  if (error) {
    authenticationRedirect("signup_unavailable");
  }

  authenticationRedirect("check_email");
}

export async function signOutAction() {
  if (hasSupabasePublicConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  if (!hasSupabasePublicConfig()) {
    authenticationRedirect("supabase_not_configured");
  }

  const email = getFormString(formData, "email");

  if (!isEmail(email)) {
    authenticationRedirect("invalid_reset_email");
  }

  const origin = (await headers()).get("origin");

  if (!origin) {
    authenticationRedirect("reset_unavailable");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`
  });

  authenticationRedirect("reset_email_sent");
}
