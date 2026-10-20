# Roadmap

## In progress: Mover role extension (this turn)
- [x] Inspect codebase, schema, auth, payments
- [ ] Migration 0002a (role enum) + 0002b (mover tables, RLS, storage, realtime) — user runs in Supabase SQL editor
- [ ] Mover onboarding (vehicle + documents, verification status)
- [ ] Mover dashboard (availability toggle, requests, jobs, earnings)
- [ ] Mover quote flow + job status progression with OTP completion
- [ ] Customer Moving Services: discovery, request form, quote comparison, booking
- [ ] Booking-linked realtime chat (no phone numbers exposed for movers)
- [ ] Real WebRTC in-app voice calling (Supabase Realtime signaling)
- [ ] Admin: approve/reject mover verifications
- [ ] Demo login for angeljamgbadi@gmail.com / pop111 (blocked in sandbox — see final notes)
- [ ] Tests for booking status transitions
- [ ] Build + typecheck verification

## Backlog (later turns)
- [ ] Real Paystack server-verified payments (keys needed)
- [ ] Branded verification emails (needs custom domain)
- [ ] Realtime tracking map for moving jobs
