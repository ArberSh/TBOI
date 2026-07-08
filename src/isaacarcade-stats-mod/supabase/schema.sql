-- Global pickup counters (this powers Higher/Lower)
create table if not exists item_pickups (
    item_id      int primary key,
    pickup_count bigint not null default 0,
    updated_at   timestamptz not null default now()
);

-- Submission log: rate limiting + ability to audit/rollback cheaters
create table if not exists pickup_submissions (
    id          bigint generated always as identity primary key,
    client_id   text not null,
    total_items int not null,
    created_at  timestamptz not null default now()
);
create index if not exists idx_submissions_client_time
    on pickup_submissions (client_id, created_at desc);

-- Atomic batch increment, called by the edge function
create or replace function increment_pickups(p_counts jsonb)
returns void
language plpgsql
security definer
as $$
declare
    r record;
begin
    for r in select key::int as item_id, value::int as amount
             from jsonb_each_text(p_counts)
    loop
        insert into item_pickups (item_id, pickup_count, updated_at)
        values (r.item_id, r.amount, now())
        on conflict (item_id)
        do update set pickup_count = item_pickups.pickup_count + excluded.pickup_count,
                      updated_at = now();
    end loop;
end;
$$;

-- Lock the tables down: only the service role (edge function) writes.
alter table item_pickups enable row level security;
alter table pickup_submissions enable row level security;

-- Public read access so your website can display counts directly
create policy "public read pickups"
    on item_pickups for select
    to anon
    using (true);

-- Item name registry: populated by the mod, read by the website
create table if not exists items (
    item_id  int  primary key,
    name     text not null
);

alter table items enable row level security;

create policy "public read items"
    on items for select
    to anon
    using (true);
