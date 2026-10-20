-- =========================================================
-- RouteShare migration 0002a — Mover role (RUN THIS FIRST)
-- Adds the 'mover' value to the existing app_role enum.
-- Must run in its own transaction BEFORE 0002b.
-- Safe to re-run.
-- =========================================================
alter type public.app_role add value if not exists 'mover';
