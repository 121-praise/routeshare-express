import { describe, it, expect } from "vitest";
import { canTransition, BOOKING_ACTION_FOR, BOOKING_FLOW } from "@/lib/moving";
import type { BookingStatus } from "@/lib/moving";

/**
 * Mirrors the server-side guard_booking_transition() trigger in
 * db/migrations-0002b-movers.sql. If these rules change, change both.
 */
describe("moving booking status transitions", () => {
  const valid: [BookingStatus, BookingStatus][] = [
    ["booked", "en_route"],
    ["en_route", "arrived_pickup"],
    ["arrived_pickup", "in_transit"],
    ["in_transit", "delivered"],
    ["delivered", "completed"],
    ["booked", "cancelled"],
    ["in_transit", "cancelled"],
    ["delivered", "cancelled"],
  ];

  it.each(valid)("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it("rejects skipping steps and going backwards", () => {
    expect(canTransition("booked", "in_transit")).toBe(false);
    expect(canTransition("booked", "completed")).toBe(false);
    expect(canTransition("in_transit", "booked")).toBe(false);
    expect(canTransition("completed", "in_transit")).toBe(false);
    expect(canTransition("cancelled", "booked")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
  });

  it("moves strictly forward through the job flow", () => {
    for (let i = 0; i < BOOKING_FLOW.length - 1; i++) {
      expect(canTransition(BOOKING_FLOW[i], BOOKING_FLOW[i + 1])).toBe(true);
    }
  });

  it("maps a mover action to every pre-delivery status", () => {
    expect(BOOKING_ACTION_FOR["booked"]!.next).toBe("en_route");
    expect(BOOKING_ACTION_FOR["en_route"]!.next).toBe("arrived_pickup");
    expect(BOOKING_ACTION_FOR["arrived_pickup"]!.next).toBe("in_transit");
    expect(BOOKING_ACTION_FOR["in_transit"]).toBeUndefined(); // delivery needs OTP
    expect(BOOKING_ACTION_FOR["completed"]).toBeUndefined();
  });
});
