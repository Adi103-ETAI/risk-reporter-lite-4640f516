import { supabase } from "@/integrations/supabase/client";

export async function ensureProfileAndDefaultRole(params?: { displayName?: string | null }) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const user = sessionData.session?.user;
  if (!user) return;

  // Profile (idempotent)
  await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      display_name: params?.displayName ?? user.user_metadata?.full_name ?? user.email ?? null,
    })
    .select("id")
    .maybeSingle();

  // Default role (idempotent). Policy only allows self-assigning 'analyst'.
  try {
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "analyst" as any });
    if (error) {
      // Ignore duplicates and "already exists" scenarios.
      // (Supabase types don't expose Postgres codes consistently in TS types.)
      return;
    }
  } catch {
    // ignore
  }
}
