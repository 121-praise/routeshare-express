import { supabase } from "@/integrations/supabase/client";

// ============= Types (mirror db/migrations-0002b-movers.sql) =============

export type MoverStatus = "pending" | "approved" | "rejected" | "suspended";
export type VehicleType = "car" | "suv" | "van" | "minibus" | "bus" | "pickup" | "truck";

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "minibus", label: "Minibus" },
  { value: "bus", label: "Bus" },
  { value: "pickup", label: "Pickup truck" },
  { value: "truck", label: "Truck" },
];

export const ITEM_CATEGORIES = [
  "Furniture", "Appliances", "Household boxes", "Office equipment",
  "Electronics", "Fragile items", "Building materials", "Pallets / bulk goods",
] as const;

export interface MoverProfile {
  id: string;
  status: MoverStatus;
  rejection_reason: string;
  vehicle_type: VehicleType | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_color: string;
  vehicle_reg: string;
  service_areas: string[];
  item_categories: string[];
  capacity_kg: number | null;
  capacity_desc: string;
  online: boolean;
  rating: number;
  jobs_completed: number;
}

export type MovingRequestStatus =
  | "open" | "quoted" | "booked" | "en_route" | "arrived_pickup"
  | "in_transit" | "delivered" | "completed" | "cancelled";

export interface MovingRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  pickup_area: string;
  dest_area: string;
  pickup_address: string;
  dest_address: string;
  pickup_date: string | null;
  pickup_time: string;
  items: { name: string; qty: number; size?: string }[];
  vehicle_category: string;
  floor_pickup: number;
  lift_pickup: boolean;
  floor_dest: number;
  lift_dest: boolean;
  assistance_needed: boolean;
  instructions: string;
  budget: number | null;
  status: MovingRequestStatus;
  created_at: string;
}

export interface MovingQuote {
  id: string;
  request_id: string;
  mover_id: string;
  price: number;
  note: string;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
}

export type BookingStatus =
  | "booked" | "en_route" | "arrived_pickup" | "in_transit"
  | "delivered" | "completed" | "cancelled";

export interface MovingBooking {
  id: string;
  request_id: string;
  quote_id: string | null;
  customer_id: string;
  mover_id: string;
  agreed_price: number;
  otp: string;
  status: BookingStatus;
  payment_status: "unpaid" | "paid";
  customer_confirmed: boolean;
  created_at: string;
}

export interface MovingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  image_path: string | null;
  read_at: string | null;
  created_at: string;
}

export interface CallSession {
  id: string;
  booking_id: string;
  caller_id: string;
  callee_id: string;
  status: "ringing" | "active" | "ended" | "declined" | "missed";
  started_at: string | null;
  ended_at: string | null;
}

// ============= Status flow (mirrors server-side guard trigger) =============

export const BOOKING_FLOW: BookingStatus[] = [
  "booked", "en_route", "arrived_pickup", "in_transit", "delivered", "completed",
];

/** Valid status transitions — must match guard_booking_transition() in the DB. */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  const allowed: Record<BookingStatus, BookingStatus[]> = {
    booked: ["en_route", "cancelled"],
    en_route: ["arrived_pickup", "cancelled"],
    arrived_pickup: ["in_transit", "cancelled"],
    in_transit: ["delivered", "cancelled"],
    delivered: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

export const BOOKING_ACTION_FOR: Partial<Record<BookingStatus, { label: string; next: BookingStatus }>> = {
  booked: { label: "Head to pickup", next: "en_route" },
  en_route: { label: "Arrived at pickup", next: "arrived_pickup" },
  arrived_pickup: { label: "Start moving", next: "in_transit" },
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  booked: "Booked",
  en_route: "En route to pickup",
  arrived_pickup: "Arrived at pickup",
  in_transit: "In transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ============= Mover profile helpers =============

export async function fetchMoverProfile(uid: string) {
  const { data, error } = await supabase
    .from("mover_profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw error;
  return (data as MoverProfile) ?? null;
}

export async function saveMoverProfile(p: Partial<MoverProfile> & { id: string }) {
  const { data, error } = await supabase
    .from("mover_profiles")
    .upsert(p, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as MoverProfile;
}

export async function addMoverDocument(moverId: string, kind: string, path: string, note = "") {
  const { error } = await supabase
    .from("mover_documents").insert({ mover_id: moverId, kind, path, note });
  if (error) throw error;
}

export async function fetchMoverDocuments(moverId: string) {
  const { data, error } = await supabase
    .from("mover_documents").select("*").eq("mover_id", moverId);
  if (error) throw error;
  return data ?? [];
}

export async function uploadMoverDoc(uid: string, kind: string, file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${uid}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("mover-docs").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;
  await addMoverDocument(uid, kind, path);
  return path;
}

export async function fetchApprovedMovers() {
  const { data, error } = await supabase
    .from("mover_profiles")
    .select("*")
    .eq("status", "approved")
    .order("rating", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MoverProfile[];
}

// ============= Moving requests =============

export async function createMovingRequest(payload: {
  customer_id: string; customer_name: string;
  pickup_area: string; dest_area: string;
  pickup_address: string; dest_address: string;
  pickup_date: string; pickup_time: string;
  items: { name: string; qty: number; size?: string }[];
  vehicle_category: string;
  floor_pickup: number; lift_pickup: boolean;
  floor_dest: number; lift_dest: boolean;
  assistance_needed: boolean; instructions: string; budget: number | null;
}) {
  const { data, error } = await supabase
    .from("moving_requests").insert(payload).select().single();
  if (error) throw error;
  return data as MovingRequest;
}

export async function fetchMovingRequest(id: string) {
  const { data, error } = await supabase
    .from("moving_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as MovingRequest) ?? null;
}

export async function fetchMyMovingRequests(customerId: string) {
  const { data, error } = await supabase
    .from("moving_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MovingRequest[];
}

export async function fetchOpenMovingRequests() {
  const { data, error } = await supabase
    .from("moving_requests")
    .select("*")
    .in("status", ["open", "quoted"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MovingRequest[];
}

// ============= Quotes =============

export async function fetchQuotes(requestId: string) {
  const { data, error } = await supabase
    .from("moving_quotes")
    .select("*")
    .eq("request_id", requestId)
    .order("price", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MovingQuote[];
}

export async function createQuote(requestId: string, moverId: string, price: number, note = "") {
  const { data, error } = await supabase
    .from("moving_quotes").insert({ request_id: requestId, mover_id: moverId, price, note })
    .select().single();
  if (error) throw error;
  return data as MovingQuote;
}

const genOtp = () => String(Math.floor(1000 + Math.random() * 10000));

/** Customer accepts a quote: creates the booking, marks the quote and request. */
export async function acceptQuote(quote: MovingQuote, request: MovingRequest) {
  const booking = {
    request_id: request.id,
    quote_id: quote.id,
    customer_id: request.customer_id,
    mover_id: quote.mover_id,
    agreed_price: quote.price,
    otp: genOtp(),
    status: "booked" as BookingStatus,
    payment_status: "unpaid" as const,
  };
  const { data, error } = await supabase
    .from("moving_bookings").insert(booking).select().single();
  if (error) throw error;
  await supabase.from("moving_requests").update({ status: "booked" }).eq("id", request.id);
  await supabase.from("moving_quotes").update({ status: "accepted" }).eq("id", quote.id);
  return data as MovingBooking;
}

// ============= Bookings =============

export async function fetchBooking(id: string) {
  const { data, error } = await supabase
    .from("moving_bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as MovingBooking) ?? null;
}

export async function fetchBookingsFor(filter: { customer_id?: string; mover_id?: string }) {
  const { data, error } = await supabase
    .from("moving_bookings")
    .select("*")
    .match(filter)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MovingBooking[];
}

export async function updateBooking(id: string, patch: Partial<MovingBooking>) {
  const { data, error } = await supabase
    .from("moving_bookings").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as MovingBooking;
}

/** Records the payment row and flips the booking to paid. */
export async function markBookingPaid(bookingId: string, amount: number, method: string) {
  await supabase.from("moving_payments").insert({
    booking_id: bookingId, amount, status: "paid", method,
    reference: `MV-${Date.now()}`,
  });
  return updateBooking(bookingId, { payment_status: "paid" });
}

// ============= Chat =============

export async function fetchMessages(bookingId: string) {
  const { data, error } = await supabase
    .from("moving_messages")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MovingMessage[];
}

export async function sendMessage(bookingId: string, senderId: string, body: string) {
  const { data, error } = await supabase
    .from("moving_messages")
    .insert({ booking_id: bookingId, sender_id: senderId, body })
    .select().single();
  if (error) throw error;
  return data as MovingMessage;
}

export async function markMessagesRead(bookingId: string, myId: string) {
  const { error } = await supabase
    .from("moving_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .neq("sender_id", myId)
    .is("read_at", null);
  if (error && error.code !== "PGRST301") console.warn("markRead:", error.message);
}

// ============= Calls =============

export async function createCallSession(bookingId: string, callerId: string, calleeId: string) {
  const { data, error } = await supabase
    .from("call_sessions")
    .insert({ booking_id: bookingId, caller_id: callerId, callee_id: calleeId, status: "ringing" })
    .select().single();
  if (error) throw error;
  return data as CallSession;
}

export async function updateCallSession(id: string, patch: Partial<CallSession>) {
  const { data, error } = await supabase
    .from("call_sessions").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as CallSession;
}

export async function fetchCallSession(id: string) {
  const { data, error } = await supabase
    .from("call_sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as CallSession) ?? null;
}

/** Subscribe to incoming calls for a user. Returns cleanup. */
export function watchIncomingCalls(
  calleeId: string,
  cb: (session: CallSession | null) => void,
) {
  const ch = supabase
    .channel(`incoming-calls-${calleeId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "call_sessions", filter: `callee_id=eq.${calleeId}` },
      (p) => cb(p.new as CallSession),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}

/** Watch a specific call session (the caller listens for the callee accepting). */
export function watchCallSession(
  sessionId: string,
  cb: (session: CallSession) => void,
) {
  const ch = supabase
    .channel(`call-session-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "call_sessions", filter: `id=eq.${sessionId}` },
      (p) => cb(p.new as CallSession),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
