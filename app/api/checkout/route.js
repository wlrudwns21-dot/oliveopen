import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getShipping } from '@/lib/shop';
import { couponUsable, couponDiscount } from '@/lib/coupon';

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return NextResponse.json({ error: 'login required' }, { status: 401 });
  const { address, delivery_request, payment_method, coupon_code, use_points, buynow } = await req.json();
  const sb = db();

  // 주문 항목 로드: 바로구매(buynow)면 단일 상품, 아니면 장바구니 전체
  let rows;
  if (buynow && buynow.product_pk) {
    const [{ data: product }, { data: option }] = await Promise.all([
      sb.from('product').select('pk, name, price, status').eq('pk', buynow.product_pk).single(),
      buynow.product_option_pk ? sb.from('product_option').select('pk, label, price').eq('pk', buynow.product_option_pk).single() : Promise.resolve({ data: null }),
    ]);
    if (!product || product.status !== 'active') return NextResponse.json({ error: '판매 중인 상품이 아니에요' }, { status: 400 });
    rows = [{
      product_pk: product.pk,
      product_option_pk: option?.pk || null,
      quantity: Math.max(1, Number(buynow.quantity || 1)),
      product: { pk: product.pk, name: product.name, price: product.price },
      product_option: option ? { pk: option.pk, label: option.label, price: option.price } : null,
    }];
  } else {
    const { data: cartRows } = await sb
      .from('cart')
      .select('*, product(pk, name, price, status), product_option(pk, label, price)')
      .eq('member_pk', s.pk);
    if (!cartRows?.length) return NextResponse.json({ error: '장바구니가 비어 있어요' }, { status: 400 });
    rows = cartRows;
  }

  const total = rows.reduce((a, c) => {
    const unit = c.product_option ? c.product_option.price : c.product?.price || 0;
    return a + unit * c.quantity;
  }, 0);
  const shipping = await getShipping();
  const fee = total >= shipping.freeThreshold ? 0 : shipping.fee;

  // 쿠폰 검증 (등급·특정상품 조건 포함, 결제 시점 재검증)
  let discount = 0;
  let coupon = null;
  if (coupon_code) {
    const { data: cp } = await sb.from('coupon').select('*').eq('code', coupon_code).maybeSingle();
    const { data: me0 } = await sb.from('member').select('grade, referral_code').eq('pk', s.pk).single();
    const ctx = { total, grade: me0?.grade || null, referralCode: me0?.referral_code || null, cartProductPks: rows.map((c) => c.product_pk) };
    if (cp && couponUsable(cp, ctx)) {
      discount = couponDiscount(cp, total);
      coupon = cp;
    }
  }
  // 적립금 사용
  let pointsUsed = 0;
  if (use_points) {
    const { data: me } = await sb.from('member').select('points').eq('pk', s.pk).single();
    pointsUsed = Math.min(me?.points || 0, Math.max(0, total - discount));
  }
  const amount = Math.max(0, total + fee - discount - pointsUsed);

  // 주문 생성
  const orderNo = 'OO' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert({
      member_pk: s.pk,
      status: 'confirmed',
      total_amount: amount,
      order_no: orderNo,
      receiver_name: address.recipient,
      receiver_phone: address.phone,
      zipcode: address.zipcode || null,
      address: address.address,
      detail_address: address.detail_address || null,
      delivery_request: delivery_request || null,
      shipping_fee: fee,
      discount_amount: discount,
      used_points: pointsUsed,
      payment_method,
      coupon_code: coupon?.code || null,
    })
    .select()
    .single();
  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  // 주문 항목 (주문 시점 스냅샷)
  const items = rows.map((c) => ({
    order_pk: order.pk,
    product_pk: c.product_pk,
    product_option_pk: c.product_option_pk,
    quantity: c.quantity,
    unit_price: c.product_option ? c.product_option.price : c.product?.price || 0,
    product_name: c.product?.name,
    option_label: c.product_option?.label || null,
  }));
  await sb.from('order_item').insert(items);

  // 결제 기록 (테스트 PG)
  await sb.from('payment').insert({
    order_pk: order.pk,
    member_pk: s.pk,
    mid: 'oliveopen_test',
    tid: 'T' + Date.now() + crypto.randomBytes(2).toString('hex'),
    moid: orderNo,
    amount,
    status: 'paid',
    pay_method: payment_method,
  });

  if (coupon) await sb.from('coupon').update({ used_count: coupon.used_count + 1 }).eq('pk', coupon.pk);
  if (pointsUsed > 0) {
    const { data: me } = await sb.from('member').select('points').eq('pk', s.pk).single();
    await sb.from('member').update({ points: Math.max(0, (me?.points || 0) - pointsUsed) }).eq('pk', s.pk);
  }
  // 결제액 1% 적립
  const { data: me2 } = await sb.from('member').select('points').eq('pk', s.pk).single();
  await sb.from('member').update({ points: (me2?.points || 0) + Math.round(amount * 0.01) }).eq('pk', s.pk);
  // 장바구니 결제만 장바구니 비움 (바로구매는 장바구니 유지)
  if (!(buynow && buynow.product_pk)) await sb.from('cart').delete().eq('member_pk', s.pk);

  return NextResponse.json({ ok: true, order_no: orderNo, amount });
}
