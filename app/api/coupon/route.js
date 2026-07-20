import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

function usable(c, total) {
  if (!c.is_active) return false;
  if (c.until && new Date(c.until) < new Date()) return false;
  if (c.issue_limit && c.used_count >= c.issue_limit) return false;
  if (total < c.min_order) return false;
  return true;
}

function discountOf(c, total) {
  return c.type === 'percent' ? Math.floor((total * c.value) / 100) : c.value;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const total = Number(searchParams.get('total') || 0);
  const sb = db();

  // code 없이 호출하면 적용 가능한 최적 쿠폰 반환 (결제 화면 '쿠폰 적용' 토글)
  if (!code) {
    const { data: coupons } = await sb.from('coupon').select('*');
    const best = (coupons || [])
      .filter((c) => usable(c, total))
      .sort((a, b) => discountOf(b, total) - discountOf(a, total))[0];
    if (!best) return NextResponse.json({ error: '적용 가능한 쿠폰이 없어요' }, { status: 404 });
    return NextResponse.json({ coupon: best, discount: discountOf(best, total) });
  }

  const { data: coupon } = await sb.from('coupon').select('*').eq('code', code).maybeSingle();
  if (!coupon) return NextResponse.json({ error: '존재하지 않는 쿠폰이에요' }, { status: 404 });
  if (!usable(coupon, total)) return NextResponse.json({ error: '적용할 수 없는 쿠폰이에요' }, { status: 400 });
  return NextResponse.json({ coupon, discount: discountOf(coupon, total) });
}
