import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig, hasSupabasePublicConfig } from "@/lib/env";

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.next({ request });
  }

  const { publishableKey, url } = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getClaims();

  return response;
}
