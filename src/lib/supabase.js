import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
"https://wjbzudhdxxtsdjvvgsis.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_octLhow3Vfdv3OBO7_Wu2g_3PdLo_p6";

export const supabase = createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY,
{
auth: {
persistSession: true,
autoRefreshToken: true,
detectSessionInUrl: true,
},
}
);