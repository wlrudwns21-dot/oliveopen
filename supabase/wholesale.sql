-- =====================================================================
--  도매 사업자(B2B) 기능 추가 마이그레이션
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 [Run] 하세요. (1회)
--  * RLS 잠금 상태: 앱은 service_role 키로 접근하므로 정책 없이도 동작합니다.
-- =====================================================================

-- 1) 도매 사업자 계정 (회원 1명당 1개) -------------------------------
create table if not exists public.wholesale_account (
  pk bigint generated always as identity primary key,
  member_pk bigint not null references public.member(pk) on delete cascade,
  company_name text not null,                 -- 상호(회사명)
  business_no text not null,                  -- 사업자등록번호
  owner_name text,                            -- 대표자명
  contact_phone text,
  contact_email text,
  zipcode text, address text, detail_address text,  -- 사업장 주소
  cert_key text,                              -- 사업자등록증 이미지 (비공개 버킷 key)
  status text not null default 'pending',     -- pending | approved | rejected
  reject_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_pk)
);
create index if not exists wholesale_account_status_idx on public.wholesale_account (status);

-- 2) 상품 도매(박스) 정보 컬럼 추가 ---------------------------------
alter table public.product
  add column if not exists is_wholesale    boolean not null default false,  -- 도매 전용관 노출
  add column if not exists wholesale_price integer,                          -- 박스당 도매 단가(원)
  add column if not exists box_label       text,                            -- 예: "10kg / 박스", "5kg×2입"
  add column if not exists min_order_box   integer not null default 1;       -- 최소 주문 박스 수

-- 3) 도매 주문 헤더 -------------------------------------------------
create table if not exists public.wholesale_order (
  pk bigint generated always as identity primary key,
  member_pk bigint references public.member(pk) on delete set null,
  order_no text,
  box_total integer not null default 0,       -- 총 박스 수
  total integer not null default 0,           -- 합계 금액(원)
  note text,
  status text not null default 'pending',     -- pending | confirmed | shipped | done | canceled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wholesale_order_member_idx on public.wholesale_order (member_pk);
create index if not exists wholesale_order_status_idx on public.wholesale_order (status);

-- 4) 도매 주문 품목 (각 품목이 자체 배송지 → 복수 배송지) -------------
create table if not exists public.wholesale_order_item (
  pk bigint generated always as identity primary key,
  order_pk bigint not null references public.wholesale_order(pk) on delete cascade,
  product_pk bigint references public.product(pk) on delete set null,
  product_name text,
  box_label text,
  box_price integer not null default 0,       -- 박스 단가
  box_qty integer not null default 1,         -- 박스 수량
  line_total integer not null default 0,      -- box_price * box_qty
  recipient_name text, recipient_phone text,
  zipcode text, address text, detail_address text,
  delivery_date date, memo text
);
create index if not exists wholesale_order_item_order_idx on public.wholesale_order_item (order_pk);

-- 5) RLS 잠금 (service_role 전용 접근) ------------------------------
alter table public.wholesale_account    enable row level security;
alter table public.wholesale_order       enable row level security;
alter table public.wholesale_order_item  enable row level security;

-- 6) 사업자등록증 비공개 스토리지 버킷 (앱이 자동 생성하지만 미리 만들어도 됨)
insert into storage.buckets (id, name, public)
values ('wholesale-docs', 'wholesale-docs', false)
on conflict (id) do nothing;
