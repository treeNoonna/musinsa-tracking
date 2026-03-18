import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

function getSupabaseAuthStorageKey(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return null;
  }

  try {
    return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  } catch {
    return null;
  }
}

export function clearSupabaseBrowserAuthState(): void {
  if (typeof document === "undefined") {
    return;
  }

  const storageKey = getSupabaseAuthStorageKey();
  if (!storageKey) {
    return;
  }

  const prefixes = [`${storageKey}.`, `${storageKey}-`];
  const cookieNames = document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name) => name === storageKey || prefixes.some((prefix) => name.startsWith(prefix)));

  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }

  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(storageKey);
    storage.removeItem(`${storageKey}-code-verifier`);
    storage.removeItem(`${storageKey}-user`);
  }
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
