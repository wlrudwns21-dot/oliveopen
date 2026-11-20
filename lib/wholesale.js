import { db } from './supabase';
import { getMemberSession } from './auth';

export const WHOLESALE_BUCKET = 'wholesale-docs';

/** 로그인 회원의 도매 계정(없으면 null) */
export async function getWholesaleAccount() {
  const s = getMemberSession();
  if (!s?.pk) return { session: null, account: null };
  const sb = db();
  const { data } = await sb.from('wholesale_account').select('*').eq('member_pk', s.pk).maybeSingle();
  return { session: s, account: data || null };
}

/** 도매 전용관 상품 (is_wholesale=true, 활성) */
export async function getWholesaleProducts() {
  const sb = db();
  const { data } = await sb
    .from('product')
    .select('pk, name, sku, price, wholesale_price, box_label, min_order_box, origin, emoji, category_pk')
    .eq('is_wholesale', true).eq('status', 'active')
    .order('sort_order');
  return data || [];
}

/** 비공개 버킷 보장 (최초 1회 생성) */
export async function ensureWholesaleBucket(sb) {
  try {
    const { data } = await sb.storage.getBucket(WHOLESALE_BUCKET);
    if (!data) await sb.storage.createBucket(WHOLESALE_BUCKET, { public: false });
  } catch {
    try { await sb.storage.createBucket(WHOLESALE_BUCKET, { public: false }); } catch {}
  }
}
