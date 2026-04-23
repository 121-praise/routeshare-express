import { supabase } from "@/integrations/supabase/client";

export type RouteRow = {
  id: string;
  rider_id: string;
  rider_name: string;
  rider_phone: string;
  rider_rating: number;
  rider_trips: number;
  pickup_area: string;
  destination_area: string;
  departure_time: string;
  capacity: number;
  price_per_package: number;
  vehicle: "Bike" | "Keke" | "Van";
  eta_minutes: number;
  min_slots_to_start: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
};

export type RequestRow = {
  id: string;
  route_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  sender_name: string;
  receiver_name: string;
  receiver_phone: string;
  pickup_address: string;
  dropoff_address: string;
  amount: number;
  otp: string;
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "paid"
    | "in_transit"
    | "delivered"
    | "cancelled";
  created_at: string;
};

export type BroadcastRow = {
  id: string;
  route_id: string;
  text: string;
  kind: "message" | "trip_started" | "trip_completed";
  created_at: string;
};

// Slots taken = accepted + paid + in_transit + delivered
export const TAKEN_STATUSES = ["accepted", "paid", "in_transit", "delivered"] as const;

export async function fetchRoutes() {
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("departure_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RouteRow[];
}

export async function fetchRoute(id: string) {
  const { data, error } = await supabase.from("routes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as RouteRow | null;
}

export async function fetchRequestsForRoute(routeId: string) {
  const { data, error } = await supabase
    .from("delivery_requests")
    .select("*")
    .eq("route_id", routeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RequestRow[];
}

export async function fetchRequest(id: string) {
  const { data, error } = await supabase
    .from("delivery_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as RequestRow | null;
}

export async function fetchBroadcasts(routeId: string) {
  const { data, error } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("route_id", routeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BroadcastRow[];
}

export function slotsTaken(reqs: RequestRow[]) {
  return reqs.filter((r) => (TAKEN_STATUSES as readonly string[]).includes(r.status)).length;
}
