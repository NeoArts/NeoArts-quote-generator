-- Hardening after security review (run once in SQL Editor after the init script; applied locally by supabase start).
-- Limits protect the shared free plan (500 MB database, 1 GB storage) from a single account filling it.

alter function public.touch_updated_at() set search_path = '';

-- Size limits on user-provided content
alter table public.quotes
    add constraint quotes_data_size check (pg_column_size(data) < 1000000),
    add constraint quotes_fields_size check (char_length(id) <= 100 and char_length(number) <= 60 and char_length(client) <= 300 and char_length(date) <= 30);
alter table public.providers
    add constraint providers_name_size check (char_length(name) between 1 and 120),
    add constraint providers_tiers_size check (pg_column_size(wholesale_discount) < 20000);

-- Per-user row caps (inserts only; updating an existing row is always allowed)
create or replace function public.limit_quotes() returns trigger
language plpgsql set search_path = '' as $$
begin
    if (select count(*) from public.quotes where user_id = new.user_id) >= 2000
       and not exists (select 1 from public.quotes where user_id = new.user_id and id = new.id) then
        raise exception 'Límite de 2000 cotizaciones por cuenta alcanzado';
    end if;
    return new;
end;
$$;

create or replace function public.limit_providers() returns trigger
language plpgsql set search_path = '' as $$
begin
    if (select count(*) from public.providers where user_id = new.user_id) >= 500
       and not exists (select 1 from public.providers where user_id = new.user_id and name = new.name) then
        raise exception 'Límite de 500 proveedores por cuenta alcanzado';
    end if;
    return new;
end;
$$;

drop trigger if exists quotes_limit on public.quotes;
create trigger quotes_limit before insert on public.quotes for each row execute function public.limit_quotes();
drop trigger if exists providers_limit on public.providers;
create trigger providers_limit before insert on public.providers for each row execute function public.limit_providers();

-- Images: 2 MB per file (the app re-encodes anything larger than 1.5 MB) and make sure the bucket is private.
update storage.buckets set file_size_limit = 2097152, public = false where id = 'product-images';
