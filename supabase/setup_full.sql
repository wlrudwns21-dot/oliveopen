-- ============================================================
--  Olive Open — 전체 스키마 설치 (신규 Supabase 프로젝트용)
--  실행 순서: 1) setup_full.sql  2) seed_data.sql
--  SQL Editor에 통째로 붙여넣고 실행하세요.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;

-- ===== 회원 / 권한 =====
create table public.member (
  pk bigint generated always as identity primary key,
  id text not null unique,
  password text not null,                     -- bcrypt (신규). 시드는 sha256 → 첫 로그인 시 자동 전환
  nick text, pre_title text, post_title text,
  extra jsonb not null default '{}'::jsonb,
  grade text not null default 'GREEN',        -- GREEN | GOLD | VIP
  points integer not null default 0,
  is_active boolean not null default true,
  referral_code text,                         -- 가입 시 사용한 추천 코드
  referred_by text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.member_group (
  pk bigint generated always as identity primary key,
  name text not null, description text,
  created_at timestamptz not null default now()
);
create table public.member_group_permission (
  pk bigint generated always as identity primary key,
  member_group_pk bigint not null references public.member_group(pk) on delete cascade,
  kind text not null, resource text, is_allowed boolean not null default true,
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
  label text, recipient text not null, phone text not null,
  zipcode text, address text not null, detail_address text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== 카탈로그 =====
create table public.category (
  pk bigint generated always as identity primary key,
  parent_pk bigint references public.category(pk) on delete set null,
  name text not null, slug text not null unique,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.product (
  pk bigint generated always as identity primary key,
  category_pk bigint references public.category(pk) on delete set null,
  sku text not null unique, name text not null, description text,
  price integer not null default 0, status text not null default 'active',
  origin text, sub_title text, original_price integer, emoji text,
  rating numeric(2,1) not null default 0, review_count integer not null default 0,
  badges jsonb not null default '[]'::jsonb, is_md_pick boolean not null default false,
  sort_order integer not null default 0, stock integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.product_option (
  pk bigint generated always as identity primary key,
  product_pk bigint not null references public.product(pk) on delete cascade,
  label text not null, price integer not null default 0, original_price integer,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.product_image (
  pk bigint generated always as identity primary key,
  product_pk bigint not null references public.product(pk) on delete cascade,
  storage_key text not null, alt_text text, sort_order integer not null default 0,
  purpose text not null default 'thumbnail',  -- thumbnail | detail
  created_at timestamptz not null default now()
);

-- ===== 장바구니 / 찜 =====
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

-- ===== 주문 / 결제 =====
create table public.orders (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete restrict,
  status text not null default 'pending', total_amount integer not null default 0,
  order_no text unique, receiver_name text, receiver_phone text,
  zipcode text, address text, detail_address text, delivery_request text,
  shipping_fee integer not null default 0, discount_amount integer not null default 0,
  used_points integer not null default 0, payment_method text, coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.order_item (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.orders(pk) on delete cascade,
  product_pk bigint references public.product(pk) on delete set null,
  quantity integer not null default 1, unit_price integer not null default 0,
  product_option_pk bigint references public.product_option(pk) on delete set null,
  product_name text, option_label text,
  created_at timestamptz not null default now()
);
create table public.order_return (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.orders(pk) on delete cascade,
  member_pk bigint not null references public.member(pk) on delete cascade,
  reason text, status text not null default 'requested', source text not null default 'customer',
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.payment (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.orders(pk) on delete cascade,
  member_pk bigint not null references public.member(pk) on delete restrict,
  mid text, tid text, moid text, amount integer not null default 0,
  status text not null default 'paid', pay_method text, canceled_amount integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== 콘텐츠 / 설정 =====
create table public.site_config (
  pk bigint generated always as identity primary key,
  config_key text not null unique, config_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.seasonal_item (
  pk bigint generated always as identity primary key,
  name text not null, emoji text, color text, origin text,
  months jsonb not null default '[]'::jsonb,
  product_pk bigint references public.product(pk) on delete set null,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.lounge_story (
  pk bigint generated always as identity primary key,
  tag text, eyebrow text, title text not null, description text,
  image_url text, link text, is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.product_review (
  pk bigint generated always as identity primary key,
  product_pk bigint not null references public.product(pk) on delete cascade,
  member_pk bigint references public.member(pk) on delete set null,
  author text, rating integer not null default 5, body text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.coupon (
  pk bigint generated always as identity primary key,
  code text not null unique, name text not null,
  type text not null default 'amount', value integer not null default 0,
  min_order integer not null default 0, used_count integer not null default 0,
  issue_limit integer, until date, is_active boolean not null default true,
  target_grade text, target_product_pk bigint references public.product(pk) on delete set null,
  is_referral boolean not null default false, referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.inquiry (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade,
  category text not null default 'general', title text not null, body text,
  status text not null default 'open', answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== 파트너 / 어드민 신청 =====
create table public.partner (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade unique,
  company text, contact text, status text not null default 'pending',
  referral_code text, approved_at timestamptz, approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.admin_request (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade unique,
  name text, requested_role text not null default 'operator', status text not null default 'pending',
  approved_at timestamptz, approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== 인덱스 =====
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
create index on public.inquiry (member_pk);
create index on public.partner (referral_code);

-- ===== updated_at 트리거 =====
do $$ declare t text; begin
  foreach t in array array['member','category','product','cart','orders','order_return','payment','site_config','member_address','product_review','coupon','seasonal_item','lounge_story','inquiry','partner','admin_request']
  loop execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t); end loop;
end $$;

-- ===== RLS 잠금 (프로덕션): RLS enabled + 정책 없음 = 기본 거부.
--       서버는 SUPABASE_SERVICE_ROLE_KEY(secret 키)로 접근하여 RLS 우회.
--       ※ 로컬 개발에서 anon 키로 직접 접근하려면 아래 주석 블록으로 개방 정책을 추가하세요. =====
do $$ declare t text; begin
  foreach t in array array['member','member_group','member_group_permission','member_group_mapping','member_address','category','product','product_option','product_image','cart','wishlist','orders','order_item','order_return','payment','site_config','seasonal_item','lounge_story','product_review','coupon','inquiry','partner','admin_request']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

/*  (개발용 개방 정책 — 필요 시 주석 해제)
do $$ declare t text; begin
  foreach t in array array['member','member_group','member_group_permission','member_group_mapping','member_address','category','product','product_option','product_image','cart','wishlist','orders','order_item','order_return','payment','site_config','seasonal_item','lounge_story','product_review','coupon','inquiry','partner','admin_request']
  loop execute format('create policy "open_access_dev" on public.%I for all using (true) with check (true)', t); end loop;
end $$;
*/

-- ===== Storage 버킷 (상품 이미지) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images', true, 10485760, array['image/png','image/jpeg','image/jpg','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 10485760;
-- 공개 URL 읽기는 public 버킷이라 정책 없이 동작. 업로드는 서버 secret 키로 RLS 우회.

-- ===== 회원 그룹 & 권한 =====
insert into public.member_group (pk, name, description) overriding system value values
 (1,'Administrator','전체 권한 (마스터)'),
 (2,'Guest','일반 고객'),
 (3,'Manager','관리자 — 회원 관리 제외'),
 (4,'Operator','운영자 — 회원·쿠폰 관리 제외'),
 (5,'CustomerService','고객센터 — 반품 처리'),
 (6,'Partner','파트너(추천인) 계정');
select setval(pg_get_serial_sequence('public.member_group','pk'), 10);

insert into public.member_group_permission (member_group_pk, kind, resource, is_allowed) values
 (1,'ADMIN','SYSTEM',true),
 (3,'ADMIN','SYSTEM',true),(3,'MANAGE_MEMBERS',null,false),
 (4,'ADMIN','SYSTEM',true),(4,'MANAGE_MEMBERS',null,false),(4,'MANAGE_COUPONS',null,false),
 (5,'CREATE_RETURN',null,true);

-- ===== 마스터 계정 (본인 계정으로 변경하세요) =====
--  아래 'YOUR_ADMIN_ID' / 'YOUR_PASSWORD' 를 원하는 값으로 바꿔 실행하면 마스터 계정이 생성됩니다.
--  (비밀번호는 sha256 저장 → 첫 로그인 시 앱이 bcrypt로 자동 전환)
insert into public.member (id, password, nick, grade, is_active)
values ('YOUR_ADMIN_ID', encode(extensions.digest(convert_to('YOUR_PASSWORD','UTF8'),'sha256'),'hex'), '마스터', 'VIP', true)
on conflict (id) do nothing;
insert into public.member_group_mapping (local_member_pk, local_member_group_pk)
select pk, 1 from public.member where id='YOUR_ADMIN_ID'
on conflict (local_member_pk, local_member_group_pk) do nothing;
