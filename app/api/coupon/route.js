import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { couponUsable, couponDiscount, couponReason } from '@/lib/coupon';

/** 로그인 회원의 등급 + 장바구니 상품 pk 목록 */
async function memberContext(sb, memberPk) {
  const [{ data: member }, { data: cart }] = await Promise.all([
    sb.from('member').select('grade, referral_code').eq('pk', memberPk).single(),
    sb.from('cart').select('product_pk').eq('member_pk', memberPk),
  ]);
  return { grade: member?.grade || null, referralCode: member?.referral_code || null, cartProductPks: (cart || []).map((c) => c.product_pk) };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const total = Number(searchParams.get('total') || 0);
  const sb = db();
  const s = getMemberSession();
  const ctx = s ? { total, ...(await memberContext(sb, s.pk)) } : { total };

  // 코드 없이 호출 → 사용 가능한 것 중 할인 큰 쿠폰 자동 선택
  if (!code) {
    const { data: coupons } = await sb.from('coupon').select('*');
    const best = (coupons || [])
      .filter((c) => couponUsable(c, ctx))
      .sort((a, b) => couponDiscount(b, total) - couponDiscount(a, total))[0];
    if (!best) return NextResponse.json({ error: '적용 가능한 쿠폰이 없어요' }, { status: 404 });
    return NextResponse.json({ coupon: best, discount: couponDiscount(best, total) });
  }

  const { data: coupon } = await sb.from('coupon').select('*').eq('code', code).maybeSingle();
  if (!coupon) return NextResponse.json({ error: '존재하지 않는 쿠폰이에요' }, { status: 404 });
  if (!couponUsable(coupon, ctx)) return NextResponse.json({ error: couponReason(coupon, ctx) }, { status: 400 });
  return NextResponse.json({ coupon, discount: couponDiscount(coupon, total) });
}
