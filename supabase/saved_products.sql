create table if not exists public.saved_products (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_url text not null,
  product_name text,
  image_url text,
  last_price bigint,
  last_checked_at timestamptz,
  source text not null default 'musinsa-price-tracker',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists saved_products_user_url_idx
  on public.saved_products (user_id, product_url);

alter table public.saved_products enable row level security;

create policy "Users can read own saved products"
  on public.saved_products
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved products"
  on public.saved_products
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved products"
  on public.saved_products
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own saved products"
  on public.saved_products
  for delete
  using (auth.uid() = user_id);
