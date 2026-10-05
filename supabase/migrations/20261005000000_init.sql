-- NeoArts quote generator: database schema for Supabase.
-- Applied to the hosted project by pasting it in SQL Editor (2026-10-05); applied locally by supabase start.
-- Every user sees only their own quotes, providers and images (row level security).

-- Providers ---------------------------------------------------------------
create table if not exists public.providers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name text not null,
    discount numeric not null default 0,
    wholesale_discount jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, name)
);

-- Quotes ------------------------------------------------------------------
-- Listing fields are columns; the rest of the quote (products, frozen provider terms,
-- PDF options) lives in `data`. Product images are files in Storage, referenced by path.
create table if not exists public.quotes (
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    id text not null,
    number text not null default '',
    client text not null default '',
    date text not null default '',
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, id)
);

create index if not exists quotes_user_date_idx on public.quotes (user_id, date desc);

-- Keep updated_at current ---------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists providers_touch on public.providers;
create trigger providers_touch before update on public.providers for each row execute function public.touch_updated_at();
drop trigger if exists quotes_touch on public.quotes;
create trigger quotes_touch before update on public.quotes for each row execute function public.touch_updated_at();

-- Row level security: owner-only access -------------------------------------
alter table public.providers enable row level security;
alter table public.quotes enable row level security;

drop policy if exists "providers: owner" on public.providers;
create policy "providers: owner" on public.providers
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "quotes: owner" on public.quotes;
create policy "quotes: owner" on public.quotes
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Product images: private bucket, one folder per user (<user id>/<file>) -------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "product-images: owner read" on storage.objects;
create policy "product-images: owner read" on storage.objects
    for select to authenticated
    using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product-images: owner insert" on storage.objects;
create policy "product-images: owner insert" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product-images: owner update" on storage.objects;
create policy "product-images: owner update" on storage.objects
    for update to authenticated
    using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product-images: owner delete" on storage.objects;
create policy "product-images: owner delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
