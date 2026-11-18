-- Phase 10, issue #45: make the subscriptions mirror explicitly client-read-only.
--
-- Clients may read their own row (select-own, #19) but must never write
-- entitlement. RLS already blocks client writes, but Supabase default privileges
-- grant insert/update/delete on new public tables to anon/authenticated at
-- creation, so an attempted self-upgrade is only silently filtered to zero rows
-- rather than denied. Revoke those writes so the boundary is an explicit hard
-- deny (permission denied), leaving the RevenueCat webhook's apply_billing_event
-- (service role, #44) as the only writer.
revoke insert, update, delete on public.subscriptions from anon, authenticated;
