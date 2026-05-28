-- =============================================
-- RifaApp - Migration Script
-- Run this in the Supabase SQL Editor
-- =============================================

-- Raffles table
create table if not exists raffles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  slug text unique not null,
  cover_image text,
  lottery_name text,
  draw_date date,
  draw_time text,
  digits integer not null check (digits in (2, 3)),
  number_price numeric,
  whatsapp text,
  created_at timestamp with time zone default now()
);

-- Prizes table
create table if not exists prizes (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid references raffles(id) on delete cascade not null,
  position integer not null check (position in (1, 2, 3)),
  title text,
  image text
);

-- Raffle numbers table
create table if not exists raffle_numbers (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid references raffles(id) on delete cascade not null,
  number text not null,
  participant_name text,
  participant_phone text,
  status text not null default 'available' check (status in ('available', 'reserved', 'paid')),
  reserved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists raffle_numbers_raffle_id_idx on raffle_numbers(raffle_id);
create index if not exists raffle_numbers_status_idx on raffle_numbers(status);
create index if not exists raffles_slug_idx on raffles(slug);
create index if not exists raffles_user_id_idx on raffles(user_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

alter table raffles enable row level security;
alter table prizes enable row level security;
alter table raffle_numbers enable row level security;

-- Raffles policies
create policy "Anyone can read raffles"
  on raffles for select using (true);

create policy "Users can insert their own raffles"
  on raffles for insert with check (auth.uid() = user_id);

create policy "Users can update their own raffles"
  on raffles for update using (auth.uid() = user_id);

create policy "Users can delete their own raffles"
  on raffles for delete using (auth.uid() = user_id);

-- Prizes policies
create policy "Anyone can read prizes"
  on prizes for select using (true);

create policy "Raffle owners can manage prizes"
  on prizes for all using (
    exists (
      select 1 from raffles
      where raffles.id = prizes.raffle_id
        and raffles.user_id = auth.uid()
    )
  );

-- Raffle numbers policies
create policy "Anyone can read raffle_numbers"
  on raffle_numbers for select using (true);

create policy "Anyone can reserve a number (update available to reserved)"
  on raffle_numbers for update using (true)
  with check (true);

create policy "Raffle owners can insert numbers"
  on raffle_numbers for insert with check (
    exists (
      select 1 from raffles
      where raffles.id = raffle_numbers.raffle_id
        and raffles.user_id = auth.uid()
    )
  );

create policy "Raffle owners can delete numbers"
  on raffle_numbers for delete using (
    exists (
      select 1 from raffles
      where raffles.id = raffle_numbers.raffle_id
        and raffles.user_id = auth.uid()
    )
  );

-- =============================================
-- Realtime
-- =============================================

-- Enable realtime for raffle_numbers
alter publication supabase_realtime add table raffle_numbers;
