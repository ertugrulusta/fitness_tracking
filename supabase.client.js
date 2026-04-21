import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabaseClientPromise = null;

async function fetchSupabaseConfig() {
  const response = await fetch("/api/config", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "Supabase config okunamadi.");
  }

  return payload;
}

export async function getSupabase() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = (async () => {
      const { supabaseUrl, supabaseAnonKey } = await fetchSupabaseConfig();
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
  }

  return supabaseClientPromise;
}
