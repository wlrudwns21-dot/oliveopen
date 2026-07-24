import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

const VOID = ['canceled', 'cancelled', 'return_completed', 'pending', 'partial_canceled'];

export async function GET(req) {
  const s = getAdminSession();
  if (!s || (!s.isAdmin && !s.isPartner)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sb = db();

  const { searchParams } = new URL(req.url);
  // 파트너는 무조건 자기 코드로 고정
  const code = s.isPartner ? s.referralCode : (searchParams.get('code') || '');

  // 마스터가 코드 미지정 → 발급자(코드)별 요약 목록
  if (!code) {
    const [{ data: coupons }, { data: members }, { data: orders }] = await Promise.all([
      sb.from('coupon').select('code, name, referrer, is_referral').eq('is_referral', true).order('pk', { ascending: false }),
      sb.from('member').select('referral_code').not('referral_code', 'is', null),
      sb.from('orders').select('coupon_code, total_amount, status').not('coupon_code', 'is', null),
    ]);
    const memCount = {};
    (members || []).forEach((m) => { memCount[m.referral_code] = (memCount[m.referral_code] || 0) + 1; });
    const ordAgg = {};
    (orders || []).forEach((o) => {
      const k = o.coupon_code;
      if (!ordAgg[k]) ordAgg[k] = { count: 0, sales: 0 };
      ordAgg[k].count += 1;
      if (!VOID.includes(o.status)) ordAgg[k].sales += o.total_amount || 0;
    });
    const list = (coupons || []).map((c) => ({
      code: c.code, name: c.name, referrer: c.referrer,
      customerCount: memCount[c.code] || 0,
      orderCount: ordAgg[c.code]?.count || 0,
      totalSales: ordAgg[c.code]?.sales || 0,
    }));
    return NextResponse.json({ mode: 'list', list });
  }

  // 특정 코드 상세
  const [{ data: coupon }, { data: customers }, { data: orders }] = await Promise.all([
    sb.from('coupon').select('code, name, referrer').eq('code', code).maybeSingle(),
    sb.from('member').select('id, nick, grade, created_at, referred_by').eq('referral_code', code).order('pk', { ascending: false }),
    sb.from('orders').select('order_no, total_amount, status, created_at, member:member_pk(id, nick)').eq('coupon_code', code).order('pk', { ascending: false }),
  ]);
  const totalSales = (orders || []).filter((o) => !VOID.includes(o.status)).reduce((a, o) => a + (o.total_amount || 0), 0);
  return NextResponse.json({
    mode: 'detail',
    code,
    referrer: coupon?.referrer || null,
    couponName: coupon?.name || null,
    totals: {
      customerCount: (customers || []).length,
      orderCount: (orders || []).length,
      totalSales,
    },
    customers: customers || [],
    orders: orders || [],
  });
}
