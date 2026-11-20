import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

async function approvedAccount(sb, pk) {
  const { data } = await sb.from('wholesale_account').select('status').eq('member_pk', pk).maybeSingle();
  return data && data.status === 'approved';
}

/** 담기 / 수량 변경 (upsert) */
export async function POST(req) {
  const s = getMemberSession();
  if (!s?.pk) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const sb = db();
  if (!(await approvedAccount(sb, s.pk))) return NextResponse.json({ error: '승인된 도매 회원만 이용할 수 있어요' }, { status: 403 });

  const b = await req.json();
  const productPk = Number(b.product_pk);
  const mode = b.mode || 'add'; // add | set
  let qty = parseInt(b.box_qty, 10) || 0;

  const { data: p } = await sb.from('product').select('pk, min_order_box, is_wholesale, status').eq('pk', productPk).maybeSingle();
  if (!p || !p.is_wholesale || p.status !== 'active') return NextResponse.json({ error: '도매 판매 상품이 아니에요' }, { status: 400 });

  const { data: existing } = await sb.from('wholesale_cart').select('pk, box_qty').eq('member_pk', s.pk).eq('product_pk', productPk).maybeSingle();
  if (mode === 'add' && existing) qty = (existing.box_qty || 0) + qty;
  const min = p.min_order_box || 1;
  if (qty < min) qty = min;

  if (existing) await sb.from('wholesale_cart').update({ box_qty: qty }).eq('pk', existing.pk);
  else await sb.from('wholesale_cart').insert({ member_pk: s.pk, product_pk: productPk, box_qty: qty });

  const { count } = await sb.from('wholesale_cart').select('pk', { count: 'exact', head: true }).eq('member_pk', s.pk);
  return NextResponse.json({ ok: true, count: count || 0 });
}

/** 품목 삭제 */
export async function DELETE(req) {
  const s = getMemberSession();
  if (!s?.pk) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const sb = db();
  const b = await req.json().catch(() => ({}));
  const productPk = Number(b.product_pk);
  await sb.from('wholesale_cart').delete().eq('member_pk', s.pk).eq('product_pk', productPk);
  const { count } = await sb.from('wholesale_cart').select('pk', { count: 'exact', head: true }).eq('member_pk', s.pk);
  return NextResponse.json({ ok: true, count: count || 0 });
}
