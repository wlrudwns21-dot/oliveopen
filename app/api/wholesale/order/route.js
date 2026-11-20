import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

export async function POST(req) {
  const s = getMemberSession();
  if (!s?.pk) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });

  const sb = db();
  // 승인된 도매 회원만 주문 가능
  const { data: acc } = await sb.from('wholesale_account').select('status').eq('member_pk', s.pk).maybeSingle();
  if (!acc || acc.status !== 'approved') return NextResponse.json({ error: '승인된 도매 회원만 주문할 수 있어요' }, { status: 403 });

  const b = await req.json();
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return NextResponse.json({ error: '주문할 상품을 추가해 주세요' }, { status: 400 });

  // 상품/도매가 재검증 (서버 기준 가격)
  const pks = [...new Set(items.map((i) => Number(i.product_pk)).filter(Boolean))];
  const { data: prods } = await sb.from('product').select('pk, name, wholesale_price, box_label, min_order_box, is_wholesale, status').in('pk', pks);
  const byPk = Object.fromEntries((prods || []).map((p) => [p.pk, p]));

  const rows = [];
  let boxTotal = 0, total = 0;
  for (const it of items) {
    const p = byPk[Number(it.product_pk)];
    if (!p || !p.is_wholesale || p.status !== 'active') return NextResponse.json({ error: '도매 판매 상품이 아니에요' }, { status: 400 });
    const qty = Math.max(parseInt(it.box_qty, 10) || 0, 0);
    if (qty < (p.min_order_box || 1)) return NextResponse.json({ error: `${p.name}: 최소 ${p.min_order_box || 1}박스부터 주문할 수 있어요` }, { status: 400 });
    if (!it.recipient_name?.trim() || !it.recipient_phone?.trim() || !it.address?.trim()) {
      return NextResponse.json({ error: '각 품목의 받는분·연락처·주소를 입력해 주세요' }, { status: 400 });
    }
    const unit = p.wholesale_price || 0;
    const line = unit * qty;
    boxTotal += qty; total += line;
    rows.push({
      product_pk: p.pk, product_name: p.name, box_label: p.box_label || null,
      box_price: unit, box_qty: qty, line_total: line,
      recipient_name: it.recipient_name.trim(), recipient_phone: it.recipient_phone.trim(),
      zipcode: it.zipcode || null, address: it.address.trim(), detail_address: it.detail_address?.trim() || null,
      delivery_date: it.delivery_date || null, memo: it.memo?.trim() || null,
    });
  }

  const orderNo = 'W' + Date.now().toString(36).toUpperCase();
  const { data: order, error } = await sb.from('wholesale_order').insert({
    member_pk: s.pk, order_no: orderNo, box_total: boxTotal, total, note: b.note?.trim() || null, status: 'pending',
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: iErr } = await sb.from('wholesale_order_item').insert(rows.map((r) => ({ ...r, order_pk: order.pk })));
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, order_no: orderNo, box_total: boxTotal, total });
}
