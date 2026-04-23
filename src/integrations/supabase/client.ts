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

// Mock-user helper (until real auth is wired). A stable per-browser id so RLS
// "owner" comparisons work and rider/customer screens see consistent data.
const LS_KEY = "routeshare:mock-user";
type MockUser = { id: string; name: string; phone: string; role: "customer" | "rider" };

export function getMockUser(): MockUser {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw);
  const u: MockUser = {
    id: crypto.randomUUID(),
    name: "Guest",
    phone: "",
    role: "customer",
  };
  localStorage.setItem(LS_KEY, JSON.stringify(u));
  return u;
}

export function setMockUser(patch: Partial<MockUser>) {
  const u = { ...getMockUser(), ...patch };
  localStorage.setItem(LS_KEY, JSON.stringify(u));
  return u;
}
