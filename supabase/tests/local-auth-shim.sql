-- Local test shim ONLY, not an implementation of Supabase Auth.
-- This file is run only by the disposable runner before migration 003.
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create role anon nologin;
create role authenticated nologin;
