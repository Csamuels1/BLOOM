-- Support-resource freshness invariant (issue #49).
--
-- A resource can only be active (and therefore visible to members) when it is
-- verified AND carries a review date, so every resource a member sees is
-- reviewed and dated. Checked as superuser against the constraints.
begin;
select plan(3);

-- An active resource with no review date is rejected.
select throws_ok(
  $$insert into public.support_resources
      (region, category, name, verified, is_active, reviewed_at)
    values ('global', 'crisis', 'No date', true, true, null)$$,
  '23514', null, 'an active resource must carry a review date');

-- An active resource that is not verified is still rejected (existing rule).
select throws_ok(
  $$insert into public.support_resources
      (region, category, name, verified, is_active, reviewed_at)
    values ('global', 'crisis', 'Unverified', false, true, now())$$,
  '23514', null, 'an active resource must be verified');

-- A verified, dated, active resource is allowed.
select lives_ok(
  $$insert into public.support_resources
      (region, category, name, verified, is_active, reviewed_at)
    values ('global', 'crisis', 'Ok', true, true, now())$$,
  'a verified, dated resource may be active');

select * from finish();
rollback;
