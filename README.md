# 올리브 오픈 (Olive Open) — 고객 웹 + 어드민

가락시장 새벽 경매 산지직송 과일 커머스. Next.js 14 (App Router) + Supabase.
기존 시스템의 DB 테이블 구성을 그대로 유지하면서 부족한 칼럼/테이블을 보강한 대체 시스템입니다.

## 배포 (GitHub → Vercel)

1. GitHub `wlrudwns21-dot/oliveopen` 저장소에 이 폴더(`oliveopen/`) **안의 내용**을 업로드
   - 제외: `node_modules/`, `.next/`, `.env.local` (`.gitignore`에 이미 명시됨)
2. https://vercel.com → **Add New Project** → GitHub 저장소 `oliveopen` Import
3. Environment Variables에 아래 4개 입력 후 Deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (권장 — Supabase 대시보드 Settings → API)
   - `SESSION_SECRET` (아무 긴 랜덤 문자열)
4. 배포 완료 후 `https://<프로젝트>.vercel.app` 이 고객 웹, `/admin` 이 어드민

> Next.js는 서버 기능(API Routes)이 필요해 GitHub Pages로는 배포할 수 없습니다. Vercel(무료)을 사용하세요.

## 실행

```bash
npm install
npm run dev   # http://localhost:3100
```

- 고객 웹: `http://localhost:3100`
- 어드민: `http://localhost:3100/admin`

### 데모 계정
| 계정 | 비밀번호 | 용도 |
|---|---|---|
| `olive` | `olive1234` | 고객 (Guest 그룹) |
| `admin` | `admin1234` | 어드민 마스터 (전체 권한) |
| `manager` | `manager1234` | 어드민 관리자 (회원 관리 불가) |
| `operator` | `operator1234` | 어드민 운영자 (회원·쿠폰 관리 불가) |

권한은 `member_group` / `member_group_permission` / `member_group_mapping` 테이블로 서버에서 검사합니다
(`ADMIN`/`SYSTEM` 허용 + `MANAGE_MEMBERS`, `MANAGE_COUPONS` 거부 행 방식).

## Supabase 연동

현재 `.env.local`은 테스트 프로젝트(`nnhrkvtvtdihlquxylra` / 114lifefortest)에 연결돼 있습니다.

**olive open 프로젝트(`nyvsqthpdgbyuetwdrvn`)로 전환하는 방법:**
1. Supabase 대시보드 → olive open 프로젝트 → SQL Editor에서
   `supabase/migrations/0001_olive_open_schema.sql` → `0002_olive_open_seed.sql` 순서로 실행
2. `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`를 해당 프로젝트 값으로 교체
3. (권장) `SUPABASE_SERVICE_ROLE_KEY`도 넣기 — 서버 전용 키라 클라이언트에 노출되지 않습니다

## DB 스키마 — 기존 테이블 유지 + 추가된 칼럼

기존 시스템과 동일한 테이블/칼럼 이름을 유지했습니다. **굵게** = 이번에 새로 추가한 칼럼.

| 테이블 | 기존 칼럼 | 추가된 칼럼 |
|---|---|---|
| `member` | pk, id, password, nick, pre_title, post_title, extra | **grade, points, is_active, last_login_at, created_at, updated_at** |
| `member_group` | pk, name | **description, created_at** |
| `member_group_permission` | pk, member_group_pk, kind, resource, is_allowed | **created_at** |
| `member_group_mapping` | pk, local_member_pk, local_member_group_pk | **created_at** |
| `category` | pk, parent_pk, name, slug, sort_order, is_active, created_at, updated_at | (없음) |
| `product` | pk, category_pk, sku, name, description, price, status, created_at, updated_at | **origin, sub_title, original_price, emoji, rating, review_count, badges(jsonb), is_md_pick, sort_order, stock** |
| `product_image` | pk, product_pk, storage_key, alt_text, sort_order, purpose, created_at | (없음) |
| `cart` | pk, member_pk, product_pk, quantity, created_at, updated_at | **product_option_pk** |
| `orders` | pk, member_pk, status, total_amount, created_at, updated_at | **order_no, receiver_name, receiver_phone, zipcode, address, detail_address, delivery_request, shipping_fee, discount_amount, used_points, payment_method** |
| `order_item` | pk, order_pk, product_pk, quantity, unit_price | **product_option_pk, product_name, option_label, created_at** |
| `order_return` | pk, order_pk, member_pk, reason, status, source, created_at, updated_at | **memo** |
| `payment` | pk, order_pk, member_pk, mid, tid, moid, amount, status, created_at | **pay_method, canceled_amount, updated_at** |
| `site_config` | pk, config_key, config_value, created_at, updated_at | (없음) — 히어로 배너는 기존 방식대로 `main_slide/<id>` 키에 JSON 저장 |

**새로 만든 테이블** (기존 시스템에 없던 디자인 요구 기능):
`product_option`(상품 옵션별 가격), `member_address`(다중 배송지), `wishlist`(찜),
`product_review`(리뷰 승인 관리), `coupon`(쿠폰), `seasonal_item`(제철 캘린더), `lounge_story`(라운지 스토리)

참고: 기존 MySQL의 `is_allowed`/`is_active` tinyint(0/1)는 Postgres `boolean`으로 변환했습니다.

## 구조

- `app/` 고객 웹 (홈·카테고리·상품·장바구니·주문결제·마이쇼핑·제철·라운지·브랜드) — 모바일 폭(430px) 프레임
- `app/admin/` 어드민 콘솔 (대시보드·주문·반품·상품·제철·홈편집·스토리·리뷰·회원·쿠폰) — 3단계 권한
- `app/api/` 서버 API — 모든 DB 접근은 서버에서만 수행 (세션: HMAC 서명 쿠키)
- `supabase/migrations/` 스키마·시드 SQL

## 프로덕션 전환 시 할 일

1. RLS `open_access_dev` 정책 제거 후 `SUPABASE_SERVICE_ROLE_KEY`만 사용하도록 잠금
2. 비밀번호 해시를 sha256 → bcrypt/argon2로 교체
3. 결제(payment.mid/tid/moid)를 실제 PG(나이스페이 등) 연동으로 교체 — 현재는 테스트 결제
4. 이미지 업로드를 Supabase Storage(`product-images/` 버킷)로 전환 (`storage_key` 필드는 그대로 사용 가능)
