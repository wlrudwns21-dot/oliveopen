-- ===== 프로덕션 보안 잠금 =====
-- 전제: 서버(Next.js)는 SUPABASE_SERVICE_ROLE_KEY(또는 sb_secret_ 키)로 접근 → RLS 우회.
--       Vercel 환경변수에 해당 키가 반드시 설정돼 있어야 함. (없으면 앱이 DB를 못 읽음)

-- 1) 개발용 개방 정책 제거 → anon/authenticated 차단 (RLS는 enabled 유지 = 기본 거부)
do $$
declare t text;
begin
  foreach t in array array['member','member_group','member_group_permission','member_group_mapping','member_address','category','product','product_option','product_image','cart','wishlist','orders','order_item','order_return','payment','site_config','seasonal_item','lounge_story','product_review','coupon','inquiry']
  loop
    execute format('drop policy if exists "open_access_dev" on public.%I', t);
  end loop;
end $$;

-- 2) Storage 개방 정책 제거 → anon 업로드/목록 차단
--    (public 버킷이라 공개 URL 읽기는 정책 없이도 동작, 업로드는 서버 secret 키로 우회)
drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_public_write" on storage.objects;

-- 3) 함수 search_path 고정 (보안 경고 해소)
alter function public.set_updated_at() set search_path = '';
