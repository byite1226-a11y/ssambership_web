import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  /** Dashboard 'anon' key is often stored as ANON_KEY; publishable is the newer name. */
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;

  const urlKeyUsed = process.env.NEXT_PUBLIC_SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : process.env.SUPABASE_URL ? "SUPABASE_URL" : "NONE";
  const anonKeyUsed = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      : process.env.SUPABASE_ANON_KEY
        ? "SUPABASE_ANON_KEY"
        : "NONE";

  if (!url?.trim() || !anonKey?.trim()) {
    console.error(
      `[supabase] Missing Supabase URL or anon/publishable key. (URL: ${Boolean(url)}, Key: ${Boolean(anonKey)}) Used: URL=${urlKeyUsed}, Key=${anonKeyUsed}`,
    );
  }

  return createServerClient(
    url ?? "",
    anonKey ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
}