import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sb = db();

  const [{ data: orders }, { count: memberCount }, { data: items }] = await Promise.all([
    sb.from('orders').select('pk, order_no, status, total_amount, created_at, member:member_pk(nick)').order('pk', { ascending: false }),
    sb.from('member').select('pk', { count: 'exact', head: true }),
    sb.from('order_item').select('product_pk, product_name, quantity'),
  ]);

  const all = orders || [];
  const valid = all.filter((o) => !['canceled', 'cancelled', 'return_completed', 'pending'].includes(o.status));
  const totalSales = valid.reduce((a, o) => a + (o.total_amount || 0), 0);
  const avg = valid.length ? Math.round(totalSales / valid.length) : 0;

  // 최근 7일 매출
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const sum = valid
      .filter((o) => (o.created_at || '').slice(0, 10) === key)
      .reduce((a, o) => a + o.total_amount, 0);
    days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, sum });
  }

  // 상태 분포
  const statusDist = {};
  all.forEach((o) => { statusDist[o.status] = (statusDist[o.status] || 0) + 1; });

  // 인기 상품 TOP5
  const byProduct = {};
  (items || []).forEach((i) => {
    const k = i.product_name || String(i.product_pk);
    byProduct[k] = (byProduct[k] || 0) + i.quantity;
  });
  const top = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return NextResponse.json({
    kpi: { totalSales, orderCount: all.length, memberCount: memberCount || 0, avg },
    days, statusDist, top, recent: all.slice(0, 6),
  });
}
