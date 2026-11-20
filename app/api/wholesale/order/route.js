import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

/**
 * 도매 주문 생성 (장바구니 기반)
 * body: {
 *   lines: [{ product_pk, shipments: [{ box_qty, recipient_name, recipient_phone, zipcode, address, detail_address, delivery_date, memo }] }],
 *   manager_name, payment_method ('normal'|'tax_invoice'), note
 * }
 * 각 (상품 × 배송지)는 wholesale_order_item 1행 → 박스 단위 복수 배송지 지원
 */
export async function POST(req) {
  const s = getMemberSession();
  if (!s?.pk) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });

  const sb = db();
  const { data: acc } = await sb.from('wholesale_account').select('status, credit_status').eq('member_pk', s.pk).maybeSingle();
  if (!acc || acc.status !== 'approved') return NextResponse.json({ error: '승인된 도매 회원만 주문할 수 있어요' }, { status: 403 });

  const b = await req.json();
  const lines = Array.isArray(b.lines) ? b.lines : [];
  if (!lines.length) return NextResponse.json({ error: '주문할 상품을 담아 주세요' }, { status: 400 });

  const paymentMethod = b.payment_method === 'tax_invoice' ? 'tax_invoice' : 'normal';
  if (paymentMethod === 'tax_invoice' && acc.credit_status !== 'approved') {
    return NextResponse.json({ error: '세금계산서(후불) 결제는 여신 승인 후 이용할 수 있어요' }, { status: 403 });
  }
  if (!b.manager_name?.trim()) return NextResponse.json({ error: '주문 담당자명을 입력해 주세요' }, { status: 400 });

  const pks = [...new Set(lines.map((l) => Number(l.product_pk)).filter(Boolean))];
  const { data: prods } = await sb.from('product').select('pk, name, wholesale_price, box_label, min_order_box, is_wholesale, status').in('pk', pks);
  const byPk = Object.fromEntries((prods || []).map((p) => [p.pk, p]));

  const rows = [];
  let boxTotal = 0, total = 0;
  for (const line of lines) {
    const p = byPk[Number(line.product_pk)];
    if (!p || !p.is_wholesale || p.status !== 'active') return NextResponse.json({ error: '도매 판매 상품이 아니에요' }, { status: 400 });
    const shipments = Array.isArray(line.shipments) ? line.shipments : [];
    if (!shipments.length) return NextResponse.json({ error: `${p.name}: 배송지를 지정해 주세요` }, { status: 400 });

    let lineBoxes = 0;
    for (const sh of shipments) {
      const qty = Math.max(parseInt(sh.box_qty, 10) || 0, 0);
      if (qty <= 0) return NextResponse.json({ error: `${p.name}: 각 배송지 박스 수를 확인해 주세요` }, { status: 400 });
      if (!sh.recipient_name?.trim() || !sh.recipient_phone?.trim() || !sh.address?.trim()) {
        return NextResponse.json({ error: `${p.name}: 각 배송지의 받는분·연락처·주소를 입력해 주세요` }, { status: 400 });
      }
      const unit = p.wholesale_price || 0;
      const lt = unit * qty;
      lineBoxes += qty; boxTotal += qty; total += lt;
      rows.push({
        product_pk: p.pk, product_name: p.name, box_label: p.box_label || null,
        box_price: unit, box_qty: qty, line_total: lt,
        recipient_name: sh.recipient_name.trim(), recipient_phone: sh.recipient_phone.trim(),
        zipcode: sh.zipcode || null, address: sh.address.trim(), detail_address: sh.detail_address?.trim() || null,
        delivery_date: sh.delivery_date || null, memo: sh.memo?.trim() || null,
      });
    }
    if (lineBoxes < (p.min_order_box || 1)) {
      return NextResponse.json({ error: `${p.name}: 최소 ${p.min_order_box || 1}박스부터 주문할 수 있어요` }, { status: 400 });
    }
  }

  const orderNo = 'W' + Date.now().toString(36).toUpperCase();
  const { data: order, error } = await sb.from('wholesale_order').insert({
    member_pk: s.pk, order_no: orderNo, box_total: boxTotal, total,
    payment_method: paymentMethod, manager_name: b.manager_name.trim(),
    note: b.note?.trim() || null, status: 'pending',
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: iErr } = await sb.from('wholesale_order_item').insert(rows.map((r) => ({ ...r, order_pk: order.pk })));
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // 주문 완료 → 장바구니 비우기
  await sb.from('wholesale_cart').delete().eq('member_pk', s.pk);

  return NextResponse.json({ ok: true, order_no: orderNo, box_total: boxTotal, total, payment_method: paymentMethod });
}
