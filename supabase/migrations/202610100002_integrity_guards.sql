-- Integrity triggers only. SECURITY INVOKER; no callable privileged allocators.
begin;
create function ics_private.reject_history_mutation() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  raise exception 'Immutable identity/history cannot be changed or deleted' using errcode = '23514';
end;
$$;
create trigger permanent_registration before update or delete on ics_private.student_registrations
for each row execute function ics_private.reject_history_mutation();
create trigger append_only_audit before update or delete on ics_private.audit_events
for each row execute function ics_private.reject_history_mutation();
create trigger permanent_student_identity before update of id, branch_id or delete on ics_private.students
for each row execute function ics_private.reject_history_mutation();
create trigger fixed_batches before update or delete on ics_private.batches
for each row execute function ics_private.reject_history_mutation();

create function ics_private.validate_registration() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  perform 1 from ics_private.admissions a
  where a.id = new.admission_id and a.branch_id = new.branch_id
    and a.admission_status = 'verified'
    and a.original_admitted_at = new.original_admitted_at
  for share;
  if not found then
    raise exception 'Registration requires matching verified initial admission' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger verified_registration before insert on ics_private.student_registrations
for each row execute function ics_private.validate_registration();

create function ics_private.preserve_registered_admission() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if exists (select 1 from ics_private.student_registrations where admission_id = old.id) then
    raise exception 'Registered initial admission is permanent' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger preserve_admission before update or delete on ics_private.admissions
for each row execute function ics_private.preserve_registered_admission();

-- Rolls must stay inside the membership. Serialize edits against parent closure.
create function ics_private.validate_roll_interval() returns trigger
language plpgsql set search_path = pg_catalog as $$
declare membership_period tstzrange;
begin
  select during into membership_period from ics_private.batch_memberships
  where branch_id = new.branch_id and id = new.membership_id and batch_id = new.batch_id
  for update;
  if membership_period is null or not
    (membership_period @> tstzrange(new.effective_from, new.effective_to, '[)')) then
    raise exception 'Roll interval must be contained in membership interval' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger contained_roll before insert or update on ics_private.membership_rolls
for each row execute function ics_private.validate_roll_interval();

-- History can only be closed once; transfers insert new rows rather than relabel.
create function ics_private.close_history_only() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Historical assignment cannot be deleted' using errcode = '23514';
  end if;
  if old.effective_to is not null or new.effective_to is null
    or (to_jsonb(new) - 'effective_to' - 'during') is distinct from
       (to_jsonb(old) - 'effective_to' - 'during') then
    raise exception 'Only closing an open interval is permitted' using errcode = '23514';
  end if;
  if tg_table_name = 'batch_memberships' and exists (
    select 1 from ics_private.membership_rolls r where r.membership_id = old.id
      and not (tstzrange(new.effective_from, new.effective_to, '[)') @> r.during)
  ) then
    raise exception 'Close roll history before closing membership' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger preserve_membership before update or delete on ics_private.batch_memberships
for each row execute function ics_private.close_history_only();
create trigger preserve_roll before update or delete on ics_private.membership_rolls
for each row execute function ics_private.close_history_only();

-- No function is an authorization entry point. No PUBLIC execution grants.
revoke all on all functions in schema ics_private from public;
commit;
