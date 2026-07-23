import { NextResponse } from 'next/server';
import { db, imageUrl } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getShipping } from '@/lib/shop';

/** '바로 구매'용 단일 상품 라인 조회 (장바구니와 무관) */
export async function GET(req) {
  const s = getMemberSession();
  if (!s) return NextResponse.json({ error: 'login required' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const productPk = Number(searchParams.get('product_pk'));
  const optionPk = searchParams.get('option_pk') ? Number(searchParams.get('option_pk')) : null;
  const qty = Math.max(1, Number(searchParams.get('qty') || 1));
  if (!productPk) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const sb = db();
  const [{ data: product }, { data: option }, shipping] = await Promise.all([
    sb.from('product').select('pk, sku, name, price, original_price, status, product_image(*)').eq('pk', productPk).single(),
    optionPk ? sb.from('product_option').select('pk, label, price, original_price').eq('pk', optionPk).single() : Promise.resolve({ data: null }),
    getShipping(),
  ]);
  if (!product || product.status !== 'active') return NextResponse.json({ error: '판매 중인 상품이 아니에요' }, { status: 400 });

  const thumb = (product.product_image || []).find((i) => i.purpose === 'thumbnail');
  const line = {
    pk: null,
    product_pk: product.pk,
    product_option_pk: option?.pk || null,
    sku: product.sku,
    name: product.name,
    option: option?.label || null,
    price: option ? option.price : product.price,
    was: option ? option.original_price : product.original_price,
    qty,
    img: imageUrl(thumb?.storage_key),
  };
  return NextResponse.json({ line, shipping });
}
