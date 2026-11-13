-- Draft-only invariant for the meal catalog (issue #113, ADR-0010).
--
-- Phase 7 content ships as unreviewed drafts: the dietitian review (#33) is
-- deferred. Until it lands, NO meal may be approved or active, so nothing
-- unreviewed is ever served. This test fails the moment any meal is activated
-- or approved without the review, guarding the deferral at the database level.
begin;
select plan(2);

select is(
  (select count(*)::int from public.meals where is_active)::int,
  0,
  'no meal is active while dietitian review is deferred (ADR-0010)');

select is(
  (select count(*)::int from public.meals where review_status = 'approved')::int,
  0,
  'no meal is approved while dietitian review is deferred (ADR-0010)');

select * from finish();
rollback;
