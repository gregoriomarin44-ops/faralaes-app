import { supabase } from "@/integrations/supabase/client";

export const getCurrentUserAdmin = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile, error: profileError } = await (supabase as any)
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    return { user: userData.user, isAdmin: false };
  }

  return { user: userData.user, isAdmin: Boolean(profile?.is_admin) };
};
