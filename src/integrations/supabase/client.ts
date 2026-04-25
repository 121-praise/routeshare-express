import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gbufkoxfjckpgvniqllc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BT_ttOMevPCk82jbAHA--w_dWrnKk84";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "routeshare-auth",
  },
});
