import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

export async function POST(req) {
  const b = await req.json();
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return NextResponse.json({ error: '신청할 상품을 추가해 주세요' }, { status: 400 });

  const sb = db();
  const s = getMemberSession();

  // 상품 검증 (한 번에 조회)
  const pkList = [...new Set(items.map((i) => Number(i.product_pk)).filter(Boolean))];
  const { data: prods } = await sb.from('product').select('pk, name, price, status').in('pk', pkList);
  const byPk = Object.fromEntries((prods || []).map((p) => [p.pk, p]));

  const rows = [];
  for (const it of items) {
    const p = byPk[Number(it.product_pk)];
    if (!p || p.status !== 'active') return NextResponse.json({ error: '판매 중이 아닌 상품이 포함됐어요' }, { status: 400 });
    if (!it.recipient_name?.trim() || !it.recipient_phone?.trim() || !it.address?.trim()) {
      return NextResponse.json({ error: '각 상품의 받는분 이름·연락처·주소를 입력해 주세요' }, { status: 400 });
    }
    rows.push({
      member_pk: s?.pk || null,
      product_pk: p.pk, product_name: p.name, product_price: p.price,
      orderer_name: b.orderer_name?.trim() || null,
      orderer_phone: b.orderer_phone?.trim() || null,
      recipient_name: it.recipient_name.trim(),
      recipient_phone: it.recipient_phone.trim(),
      zipcode: it.zipcode || null,
      address: it.address.trim(),
      detail_address: it.detail_address?.trim() || null,
      delivery_date: it.delivery_date || null,
      memo: it.memo?.trim() || null,
    });
  }

  const { error } = await sb.from('gift_order').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
