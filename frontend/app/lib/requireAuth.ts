import { supabase } from "./superbaseClient";

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}