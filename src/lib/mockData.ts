export type Role = "customer" | "rider" | "admin";

export interface Route {
  id: string;
  riderId: string;
  riderName: string;
  riderRating: number;
  riderTrips: number;
  pickupArea: string;
  destinationArea: string;
  departureTime: string; // ISO
  capacity: number;
  taken: number;
  pricePerPackage: number; // NGN
  vehicle: "Bike" | "Keke" | "Van";
  etaMinutes: number;
  minSlotsToStart: number;
  status: "scheduled" | "ongoing" | "completed";
}

export interface Delivery {
  id: string;
  routeId: string;
  customerName: string;
  receiverPhone: string;
  pickup: string;
  dropoff: string;
  amount: number;
  otp: string;
  status: "awaiting_payment" | "paid" | "in_transit" | "delivered" | "disputed";
  createdAt: string;
}

export interface BroadcastMessage {
  id: string;
  routeId: string;
  text: string;
  at: string;
}

const now = Date.now();
const inMin = (m: number) => new Date(now + m * 60000).toISOString();

export const mockRoutes: Route[] = [
  {
    id: "r1",
    riderId: "u1",
    riderName: "Tunde A.",
    riderRating: 4.9,
    riderTrips: 312,
    pickupArea: "Yaba",
    destinationArea: "Lekki Phase 1",
    departureTime: inMin(35),
    capacity: 6,
    taken: 3,
    pricePerPackage: 1800,
    vehicle: "Bike",
    etaMinutes: 55,
  },
  {
    id: "r2",
    riderId: "u2",
    riderName: "Chiamaka O.",
    riderRating: 4.8,
    riderTrips: 188,
    pickupArea: "Ikeja",
    destinationArea: "Victoria Island",
    departureTime: inMin(60),
    capacity: 8,
    taken: 5,
    pricePerPackage: 2200,
    vehicle: "Keke",
    etaMinutes: 70,
  },
  {
    id: "r3",
    riderId: "u3",
    riderName: "Seun B.",
    riderRating: 5.0,
    riderTrips: 540,
    pickupArea: "Surulere",
    destinationArea: "Ajah",
    departureTime: inMin(120),
    capacity: 10,
    taken: 2,
    pricePerPackage: 2500,
    vehicle: "Van",
    etaMinutes: 90,
  },
  {
    id: "r4",
    riderId: "u4",
    riderName: "Bisi K.",
    riderRating: 4.7,
    riderTrips: 96,
    pickupArea: "Yaba",
    destinationArea: "Ikoyi",
    departureTime: inMin(15),
    capacity: 5,
    taken: 4,
    pricePerPackage: 1500,
    vehicle: "Bike",
    etaMinutes: 45,
  },
];

export const mockDeliveries: Delivery[] = [
  {
    id: "d1",
    routeId: "r1",
    customerName: "Amaka N.",
    receiverPhone: "0803 222 1144",
    pickup: "Akoka, Yaba",
    dropoff: "Admiralty Way, Lekki",
    amount: 1800,
    otp: "4821",
    status: "paid",
    createdAt: new Date(now - 5 * 60000).toISOString(),
  },
  {
    id: "d2",
    routeId: "r1",
    customerName: "Kola J.",
    receiverPhone: "0701 998 0011",
    pickup: "Sabo, Yaba",
    dropoff: "Chevron Drive, Lekki",
    amount: 1800,
    otp: "7390",
    status: "paid",
    createdAt: new Date(now - 12 * 60000).toISOString(),
  },
  {
    id: "d3",
    routeId: "r1",
    customerName: "Ngozi P.",
    receiverPhone: "0809 444 7766",
    pickup: "Tejuosho, Yaba",
    dropoff: "Lekki Phase 1 Gate",
    amount: 1800,
    otp: "1265",
    status: "in_transit",
    createdAt: new Date(now - 25 * 60000).toISOString(),
  },
];

export const mockBroadcasts: BroadcastMessage[] = [
  { id: "b1", routeId: "r1", text: "Loading packages now. Departing in 10 mins.", at: new Date(now - 9 * 60000).toISOString() },
  { id: "b2", routeId: "r1", text: "On Third Mainland Bridge. Light traffic.", at: new Date(now - 3 * 60000).toISOString() },
];

export const ngn = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export const minsFromNow = (iso: string) => {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diff <= 0) return "Departing now";
  if (diff < 60) return `in ${diff} min`;
  const h = Math.floor(diff / 60);
  return `in ${h}h ${diff % 60}m`;
};
