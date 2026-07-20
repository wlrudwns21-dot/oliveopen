-- Olive Open commerce schema (기존 시스템 테이블 구성 유지 + 보강 칼럼)
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table public.member (
  pk bigint generated always as identity primary key,
  id text not null unique,
  password text not null,
  nick text,
  pre_title text,
  post_title text,
  extra jsonb not null default '{}'::jsonb,
  grade text not null default 'GREEN',
  points integer not null default 0,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_group (
  pk bigint generated always as identity primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.member_group_permission (
  pk bigint generated always as identity primary key,
  member_group_pk bigint not null references public.member_group(pk) on delete cascade,
  kind text not null,
  resource text,
  is_allowed boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.member_group_mapping (
  pk bigint generated always as identity primary key,
  local_member_pk bigint not null references public.member(pk) on delete cascade,
  local_member_group_pk bigint not null references public.member_group(pk) on delete cascade,
  created_at timestamptz not null default now(),
  unique (local_member_pk, local_member_group_pk)
);

create table public.member_address (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade,
  label text,
  recipient text not null,
  phone text not null,
  zipcode text,
  address text not null,
  detail_address text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category (
  pk bigint generated always as identity primary key,
  parent_pk bigint references public.category(pk) on delete set null,
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product (
  pk bigint generated always as identity primary key,
  category_pk bigint references public.category(pk) on delete set null,
  sku text not null unique,
  name text not null,
  description text,
  price integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  origin text,
  sub_title text,
  original_price integer,
  emoji text,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  badges jsonb not null default '[]'::jsonb,
  is_md_pick boolean not null default false,
  sort_order integer not null default 0,
  stock integer not null default 999
);

create table public.product_option (
  pk bigint generated always as identity primary key,
  product_pk bigint not null references public.product(pk) on delete cascade,
  label text not null,
  price integer not null default 0,
  original_price integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_image (
  pk bigint generated always as identity primary key,
  product_pk bigint not null references public.product(pk) on delete cascade,
  storage_key text not null,
  alt_text text,
  sort_order integer not null default 0,
  purpose text not null default 'thumbnail',
  created_at timestamptz not null default now()
);

create table public.cart (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade,
  product_pk bigint not null references public.product(pk) on delete cascade,
  quantity integer not null default 1,
  product_option_pk bigint references public.product_option(pk) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (member_pk, product_pk, product_option_pk)
);

create table public.wishlist (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade,
  product_pk bigint not null references public.product(pk) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_pk, product_pk)
);

create table public.orders (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete restrict,
  status text not null default 'pending',
  total_amount integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_no text unique,
  receiver_name text,
  receiver_phone text,
  zipcode text,
  address text,
  detail_address text,
  delivery_request text,
  shipping_fee integer not null default 0,
  discount_amount integer not null default 0,
  used_points integer not null default 0,
  payment_method text
);

create table public.order_item (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.orders(pk) on delete cascade,
  product_pk bigint references public.product(pk) on delete set null,
  quantity integer not null default 1,
  unit_price integer not null default 0,
  product_option_pk bigint references public.product_option(pk) on delete set null,
  product_name text,
  option_label text,
  created_at timestamptz not null default now()
);

create table public.order_return (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.orders(pk) on delete cascade,
  member_pk bigint not null references public.member(pk) on delete cascade,
  reason text,
  status text not null default 'requested',
  source text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  memo text
);

create table public.payment (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.orders(pk) on delete cascade,
  member_pk bigint not null references public.member(pk) on delete restrict,
  mid text,
  tid text,
  moid text,
  amount integer not null default 0,
  status text not null default 'paid',
  created_at timestamptz not null default now(),
  pay_method text,
  canceled_amount integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.site_config (
  pk bigint generated always as identity primary key,
  config_key text not null unique,
  config_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasonal_item (
  pk bigint generated always as identity primary key,
  name text not null,
  emoji text,
  color text,
  origin text,
  months jsonb not null default '[]'::jsonb,
  product_pk bigint references public.product(pk) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lounge_story (
  pk bigint generated always as identity primary key,
  tag text,
  eyebrow text,
  title text not null,
  description text,
  image_url text,
  link text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_review (
  pk bigint generated always as identity primary key,
  product_pk bigint not null references public.product(pk) on delete cascade,
  member_pk bigint references public.member(pk) on delete set null,
  author text,
  rating integer not null default 5,
  body text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupon (
  pk bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  type text not null default 'amount',
  value integer not null default 0,
  min_order integer not null default 0,
  used_count integer not null default 0,
  issue_limit integer,
  until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.product (category_pk);
create index on public.product_option (product_pk);
create index on public.product_image (product_pk);
create index on public.cart (member_pk);
create index on public.orders (member_pk);
create index on public.order_item (order_pk);
create index on public.order_return (order_pk);
create index on public.payment (order_pk);
create index on public.product_review (product_pk);
create index on public.member_group_mapping (local_member_pk);

do $$
declare t text;
begin
  foreach t in array array['member','category','product','cart','orders','order_return','payment','site_config','member_address','product_review','coupon','seasonal_item','lounge_story']
  loop
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- RLS (테스트 단계: 전체 허용 — 프로덕션 전환 시 service_role 전용으로 잠글 것)
do $$
declare t text;
begin
  foreach t in array array['member','member_group','member_group_permission','member_group_mapping','member_address','category','product','product_option','product_image','cart','wishlist','orders','order_item','order_return','payment','site_config','seasonal_item','lounge_story','product_review','coupon']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "open_access_dev" on public.%I for all using (true) with check (true)', t);
  end loop;
end $$;
