import { NextResponse } from 'next/server';
import { db, imageUrl } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getShipping } from '@/lib/shop';

function unauthorized() {
  return NextResponse.json({ error: 'login required' }, { status: 401 });
}

export async function GET() {
  const s = getMemberSession();
  if (!s) return unauthorized();
  const [{ data }, shipping] = await Promise.all([
    db()
      .from('cart')
      .select('*, product(pk, sku, name, price, original_price, status, product_image(*)), product_option(pk, label, price, original_price)')
      .eq('member_pk', s.pk)
      .order('pk'),
    getShipping(),
  ]);
  const lines = (data || []).map((c) => {
    const thumb = (c.product?.product_image || []).find((i) => i.purpose === 'thumbnail');
    const price = c.product_option ? c.product_option.price : c.product?.price || 0;
    const was = c.product_option ? c.product_option.original_price : c.product?.original_price;
    return {
      pk: c.pk,
      product_pk: c.product_pk,
      sku: c.product?.sku,
      name: c.product?.name,
      option: c.product_option?.label || null,
      price, was,
      qty: c.quantity,
      img: imageUrl(thumb?.storage_key),
    };
  });
  return NextResponse.json({ lines, shipping });
}

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return unauthorized();
  const { product_pk, product_option_pk, quantity } = await req.json();
  const sb = db();
  let q = sb.from('cart').select('pk, quantity').eq('member_pk', s.pk).eq('product_pk', product_pk);
  q = product_option_pk == null ? q.is('product_option_pk', null) : q.eq('product_option_pk', product_option_pk);
  const { data: existing } = await q.maybeSingle();

  if (existing && existing.pk) {
    await sb.from('cart').update({ quantity: existing.quantity + (quantity || 1) }).eq('pk', existing.pk);
  } else {
    const { error } = await sb.from('cart').insert({
      member_pk: s.pk, product_pk, product_option_pk: product_option_pk || null, quantity: quantity || 1,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const s = getMemberSession();
  if (!s) return unauthorized();
  const { pk, quantity } = await req.json();
  const sb = db();
  if (quantity <= 0) await sb.from('cart').delete().eq('pk', pk).eq('member_pk', s.pk);
  else await sb.from('cart').update({ quantity }).eq('pk', pk).eq('member_pk', s.pk);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const s = getMemberSession();
  if (!s) return unauthorized();
  const { pk } = await req.json();
  await db().from('cart').delete().eq('pk', pk).eq('member_pk', s.pk);
  return NextResponse.json({ ok: true });
}
