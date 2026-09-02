import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

export async function POST(req) {
  const b = await req.json();
  if (!b.product_pk || !b.recipient_name?.trim() || !b.recipient_phone?.trim() || !b.address?.trim()) {
    return NextResponse.json({ error: '상품·받는분 이름·연락처·주소는 필수예요' }, { status: 400 });
  }
  const sb = db();
  const { data: product } = await sb.from('product').select('pk, name, price, status').eq('pk', b.product_pk).single();
  if (!product || product.status !== 'active') return NextResponse.json({ error: '판매 중인 상품이 아니에요' }, { status: 400 });

  const s = getMemberSession();
  const { data, error } = await sb.from('gift_order').insert({
    member_pk: s?.pk || null,
    product_pk: product.pk,
    product_name: product.name,
    product_price: product.price,
    orderer_name: b.orderer_name?.trim() || null,
    orderer_phone: b.orderer_phone?.trim() || null,
    recipient_name: b.recipient_name.trim(),
    recipient_phone: b.recipient_phone.trim(),
    zipcode: b.zipcode || null,
    address: b.address.trim(),
    detail_address: b.detail_address?.trim() || null,
    delivery_date: b.delivery_date || null,
    memo: b.memo?.trim() || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pk: data.pk });
}
