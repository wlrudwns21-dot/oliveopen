# 올리브 오픈 — 새 서버 환경 설치 가이드

고객 모바일 웹 + 어드민 콘솔 (Next.js 14 App Router + Supabase). 이 패키지만으로 처음부터 재구축할 수 있습니다.

## 0. 구성 요약
- **프론트/백엔드**: Next.js 14 (App Router). 모든 DB 접근은 서버(API Routes/서버 컴포넌트)에서만.
- **DB / 스토리지 / 인증데이터**: Supabase (PostgreSQL + Storage).
- **인증**: 자체 세션(HMAC 서명 쿠키) + bcrypt 비밀번호. (Supabase Auth 미사용)
- **배포**: Vercel 권장 (Node 18+ 서버리스). Netlify/자체 Node 서버도 가능.

## 1. Supabase 프로젝트 준비
1. supabase.com에서 새 프로젝트 생성 (리전: 한국이면 Seoul/Tokyo 권장).
2. **SQL Editor**에서 순서대로 실행:
   1) `supabase/setup_full.sql` — 전체 스키마 + Storage 버킷 + 권한 그룹 + RLS 잠금.
      - 파일 하단의 `YOUR_ADMIN_ID` / `YOUR_PASSWORD` 를 원하는 마스터 계정 값으로 바꿔서 실행하세요.
   2) `supabase/seed_data.sql` — 카테고리/상품/옵션/이미지/사이트설정/제철/스토리/쿠폰/리뷰 기본 데이터.
3. **Project Settings → API** 에서 값 확보:
   - Project URL (예: `https://xxxx.supabase.co`)
   - **Publishable key**(`sb_publishable_...`) 또는 legacy anon 키
   - **Secret key**(`sb_secret_...`) 또는 legacy service_role 키 ← 서버 전용, RLS 우회에 필요

## 2. 환경변수 (.env.local 또는 배포 플랫폼 환경변수)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=<publishable 또는 anon 키>
SUPABASE_SERVICE_ROLE_KEY=<secret 또는 service_role 키>   # RLS 잠금 상태에선 필수
SESSION_SECRET=<아무 긴 랜덤 문자열>
JUSO_CONFM_KEY=<도로명주소 검색 승인키(선택) - juso.go.kr>
```
> `.env.example` 참고. RLS를 잠갔으므로 **SUPABASE_SERVICE_ROLE_KEY가 없으면 앱이 DB를 못 읽습니다.**
> 서버 코드는 `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY` 순으로 사용합니다(lib/supabase.js).

## 3. 로컬 실행
```bash
npm install
npm run dev        # http://localhost:3100
```

## 4. 배포 (Vercel 예시)
1. GitHub에 이 폴더를 올리고 Vercel에서 Import.
2. Framework Preset: **Next.js** (자동 감지).
3. 위 환경변수 4~5개 입력 → Deploy.
4. `https://<프로젝트>.vercel.app` = 고객 웹, `/admin` = 어드민.

## 5. 첫 로그인 / 운영 계정
- **마스터 어드민**: setup_full.sql에서 지정한 아이디/비밀번호로 `/admin/login` 로그인.
- **어드민 추가**: `/admin/apply` 신청 → 마스터가 어드민 콘솔 "어드민 승인"에서 역할(관리자/운영자) 승인.
- **파트너(추천인)**: `/partner/apply` 신청 → 마스터가 "파트너 관리"에서 승인 + 추천인 코드 배정.
- **고객**: 고객 웹 `/signup` 회원가입.

## 6. 이미지
- 기본 상품 이미지는 앱 `public/assets/` 에 포함되어 별도 업로드 없이 동작합니다.
- 어드민에서 새 이미지를 올리면 Supabase Storage `product-images` 버킷에 저장됩니다.

## 7. 보안 메모 (이미 적용됨)
- RLS 잠금(정책 없음 = 기본 거부, 서버 secret 키만 접근). Storage 업로드도 서버 전용.
- 비밀번호 bcrypt. 결제는 **테스트(모의)** 이므로 실서비스 전 실제 PG(나이스페이 등) 연동 필요.

## 주요 폴더
```
app/                고객 웹 + /admin 어드민 + /api 서버 라우트
components/         UI 컴포넌트 (admin/ 하위 = 어드민 전용)
lib/                supabase 클라이언트, auth(세션/bcrypt), shop, format, coupon
public/assets/      기본 이미지
supabase/           setup_full.sql, seed_data.sql, migrations/(이력)
```
