import { db } from './supabase';
import { getMemberSession } from './auth';

export const WHOLESALE_BUCKET = 'wholesale-docs';

/** 업종 선택지 (가입/온보딩 맥락용) */
export const INDUSTRIES = ['식당·외식', '카페·베이커리', '마트·슈퍼', '납품·도소매', '급식·단체', '기타'];

/** 로그인 회원의 도매 계정(없으면 null) */
export async function getWholesaleAccount() {
  const s = getMemberSession();
  if (!s?.pk) return { session: null, account: null };
  const sb = db();
  const { data } = await sb.from('wholesale_account').select('*').eq('member_pk', s.pk).maybeSingle();
  return { session: s, account: data || null };
}

const PROD_FIELDS = 'pk, name, sku, price, wholesale_price, box_label, min_order_box, origin, emoji, sub_title, is_md_pick, rating, review_count, badges, category_pk, images:product_image(storage_key, purpose, sort_order)';

function withThumb(p) {
  if (!p) return p;
  const imgs = p.images || [];
  const thumb = imgs.find((i) => i.purpose === 'thumbnail') || imgs[0];
  return { ...p, thumb: thumb?.storage_key || null, images: undefined };
}

/** 도매 전용관 상품 목록 (is_wholesale=true, 활성) */
export async function getWholesaleProducts() {
  const sb = db();
  const { data } = await sb
    .from('product')
    .select(PROD_FIELDS)
    .eq('is_wholesale', true).eq('status', 'active')
    .order('sort_order');
  return (data || []).map(withThumb);
}

/** 도매 상품 단건 (sku) */
export async function getWholesaleProduct(sku) {
  const sb = db();
  const { data } = await sb
    .from('product')
    .select(PROD_FIELDS + ', description')
    .eq('sku', sku).eq('is_wholesale', true).eq('status', 'active')
    .maybeSingle();
  return withThumb(data);
}

/** 도매 장바구니 (상품 정보 포함) */
export async function getWholesaleCart(memberPk) {
  const sb = db();
  const { data } = await sb
    .from('wholesale_cart')
    .select('pk, box_qty, product:product_pk(' + PROD_FIELDS + ', is_wholesale, status)')
    .eq('member_pk', memberPk)
    .order('created_at');
  return (data || [])
    .filter((r) => r.product && r.product.is_wholesale && r.product.status === 'active')
    .map((r) => ({ pk: r.pk, box_qty: r.box_qty, product: withThumb(r.product) }));
}

/** 도매 장바구니 담긴 품목 수 */
export async function getWholesaleCartCount(memberPk) {
  const sb = db();
  const { count } = await sb.from('wholesale_cart').select('pk', { count: 'exact', head: true }).eq('member_pk', memberPk);
  return count || 0;
}

/** 도매 주문 내역 */
export async function getWholesaleOrders(memberPk) {
  const sb = db();
  const { data } = await sb
    .from('wholesale_order')
    .select('*, items:wholesale_order_item(*)')
    .eq('member_pk', memberPk)
    .order('created_at', { ascending: false });
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
