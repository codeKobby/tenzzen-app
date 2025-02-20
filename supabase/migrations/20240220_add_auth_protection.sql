-- Enable RLS on auth tables
alter table auth.users enable row level security;

-- Create an auth attempts tracking table
create table if not exists auth.login_attempts (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  ip_address text not null,
  created_at timestamptz default now(),
  successful boolean not null default false
);

create index on auth.login_attempts(email, created_at);
create index on auth.login_attempts(ip_address, created_at);

-- Function to check login attempts
create or replace function auth.check_login_attempts(
  check_email text,
  check_ip text
) returns boolean as $$
declare
  recent_failed_attempts int;
begin
  -- Count failed attempts in last 15 minutes
  select count(*)
  into recent_failed_attempts
  from auth.login_attempts
  where email = check_email
    and ip_address = check_ip
    and successful = false
    and created_at > now() - interval '15 minutes';
    
  -- Block if too many failed attempts
  return recent_failed_attempts < 5;
end;
$$ language plpgsql security definer;

-- Function to track login attempts
create or replace function auth.track_login_attempt(
  attempt_email text,
  attempt_ip text,
  was_successful boolean
) returns void as $$
begin
  insert into auth.login_attempts (email, ip_address, successful)
  values (attempt_email, attempt_ip, was_successful);
  
  -- Clean up old attempts (keep last 30 days)
  delete from auth.login_attempts 
  where created_at < now() - interval '30 days';
end;
$$ language plpgsql security definer;

-- RLS policies
create policy "Can view own login attempts"
  on auth.login_attempts for select
  using (auth.uid() = (select id from auth.users where email = auth.login_attempts.email));

-- Protection against rapid signups from same IP
create or replace function auth.check_signup_cooldown(check_ip text)
returns boolean as $$
declare
  recent_signups int;
begin
  select count(*)
  into recent_signups
  from auth.users
  where metadata->>'signup_ip' = check_ip
    and created_at > now() - interval '24 hours';
    
  return recent_signups < 3; -- Max 3 accounts per IP per day
end;
$$ language plpgsql security definer;

-- Enable request logging for auth endpoints
create table if not exists auth.request_logs (
  id uuid primary key default uuid_generate_v4(),
  path text not null,
  method text not null,
  ip_address text not null,
  user_agent text,
  created_at timestamptz default now()
);

create index on auth.request_logs(ip_address, created_at);

-- Function to log auth requests
create or replace function auth.log_request(
  request_path text,
  request_method text,
  request_ip text,
  request_user_agent text default null
) returns void as $$
begin
  insert into auth.request_logs (path, method, ip_address, user_agent)
  values (request_path, request_method, request_ip, request_user_agent);
  
  -- Clean up old logs (keep last 7 days)
  delete from auth.request_logs 
  where created_at < now() - interval '7 days';
end;
$$ language plpgsql security definer;
