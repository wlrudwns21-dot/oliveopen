import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let client;

/** 서버 전용 Supabase 클라이언트 (service key가 있으면 RLS 우회)
 *  fetch에 cache:'no-store'를 강제해 Next.js 데이터 캐시를 우회 → 어드민 변경이 즉시 반영됨 */
export function db() {
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    });
  }
  return client;
}

/** product_image.storage_key → 브라우저에서 접근 가능한 URL */
export function imageUrl(storageKey) {
  if (!storageKey) return '/assets/logo-emblem.png';
  if (storageKey.startsWith('http') || storageKey.startsWith('/')) return storageKey;
  return `${url}/storage/v1/object/public/${storageKey}`;
}
