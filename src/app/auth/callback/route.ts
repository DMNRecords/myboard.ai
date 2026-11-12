import { type NextRequest, NextResponse } from "next/server";

import { hasSupabasePublicConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next =
    request.nextUrl.searchParams.get("next") === "/update-password"
      ? "/update-password"
      : "/projects";

  if (!code || !hasSupabasePublicConfig()) {
    return NextResponse.redirect(new URL("/login?message=confirm_failed", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?message=confirm_failed", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
