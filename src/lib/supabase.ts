import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function env(name: string) {
  const v = (import.meta as any).env?.[name]
  return typeof v === "string" ? v : ""
}

const url = env("VITE_SUPABASE_URL")
const anonKey = env("VITE_SUPABASE_ANON_KEY")

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
