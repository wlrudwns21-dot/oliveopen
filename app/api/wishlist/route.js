import { NextResponse } from 'next/server';
import { db, imageUrl } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

function unauth() { return NextResponse.json({ error: 'login required' }, { status: 401 }); }

export async function GET() {
  const s = getMemberSession();
  if (!s) return unauth();
  const { data } = await db()
    .from('wishlist')
    .select('pk, product:product_pk(pk, sku, name, price, original_price, origin, product_image(*))')
    .eq('member_pk', s.pk)
    .order('pk', { ascending: false });
  const items = (data || []).filter((w) => w.product).map((w) => {
    const thumb = (w.product.product_image || []).find((i) => i.purpose === 'thumbnail');
    return {
      pk: w.pk,
      sku: w.product.sku,
      name: w.product.name,
      price: w.product.price,
      was: w.product.original_price,
      origin: w.product.origin,
      img: imageUrl(thumb?.storage_key),
    };
  });
  return NextResponse.json({ items });
}

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return unauth();
  const { product_pk } = await req.json();
  const sb = db();
  const { data: exists } = await sb
    .from('wishlist').select('pk').eq('member_pk', s.pk).eq('product_pk', product_pk).maybeSingle();
  if (exists) {
    await sb.from('wishlist').delete().eq('pk', exists.pk);
    return NextResponse.json({ added: false });
  }
  await sb.from('wishlist').insert({ member_pk: s.pk, product_pk });
  return NextResponse.json({ added: true });
}

export async function DELETE(req) {
  const s = getMemberSession();
  if (!s) return unauth();
  const { pk } = await req.json();
  await db().from('wishlist').delete().eq('pk', pk).eq('member_pk', s.pk);
  return NextResponse.json({ ok: true });
}
