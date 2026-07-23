import { db, imageUrl } from './supabase';
import { getMemberSession } from './auth';

/** product 행(+product_image, product_option 임베드) → 카드 데이터 */
export function cardData(p) {
  const thumb = (p.product_image || []).find((i) => i.purpose === 'thumbnail');
  const opts = (p.product_option || []).filter((o) => o.is_active).sort((a, b) => a.sort_order - b.sort_order);
  return {
    pk: p.pk,
    sku: p.sku,
    name: p.name,
    sub: p.sub_title || p.description || '',
    price: p.price,
    was: p.original_price,
    img: imageUrl(thumb?.storage_key),
    tags: p.badges || [],
    optionPk: opts[0]?.pk || null,
    emoji: p.emoji,
  };
}

export async function getActiveProducts() {
  const { data } = await db()
    .from('product')
    .select('*, product_image(*), product_option(*)')
    .eq('status', 'active')
    .order('sort_order');
  return data || [];
}

export async function getCartCount() {
  const s = getMemberSession();
  if (!s) return 0;
  const { data } = await db().from('cart').select('quantity').eq('member_pk', s.pk);
  return (data || []).reduce((a, c) => a + c.quantity, 0);
}

/** 배송비 정책 (site_config.shipping, 없으면 기본값) */
export async function getShipping() {
  const { data } = await db().from('site_config').select('config_value').eq('config_key', 'shipping').maybeSingle();
  let conf = {};
  try { conf = JSON.parse(data?.config_value || '{}') || {}; } catch {}
  return {
    freeThreshold: Number.isFinite(Number(conf.free_threshold)) && conf.free_threshold !== '' ? Number(conf.free_threshold) : 30000,
    fee: Number.isFinite(Number(conf.fee)) && conf.fee !== '' ? Number(conf.fee) : 3000,
  };
}

/** 로그인한 회원이 찜한 product_pk 집합 (비로그인 시 빈 Set) */
export async function getWishedPks() {
  const s = getMemberSession();
  if (!s) return new Set();
  const { data } = await db().from('wishlist').select('product_pk').eq('member_pk', s.pk);
  return new Set((data || []).map((w) => w.product_pk));
}

export function getSiteConf(configs) {
  const conf = {};
  (configs || []).forEach((c) => {
    try { conf[c.config_key] = JSON.parse(c.config_value); }
    catch { conf[c.config_key] = c.config_value; }
  });
  const slides = Object.keys(conf)
    .filter((k) => k.startsWith('main_slide/'))
    .map((k) => conf[k])
    .filter((s) => s && s.active !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  // 활성화된 팝업 목록
  const popups = Object.keys(conf)
    .filter((k) => k.startsWith('popup/'))
    .map((k) => conf[k])
    .filter((p) => p && p.active === true)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return { conf, slides, popups };
}
