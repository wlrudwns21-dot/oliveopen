import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return NextResponse.json({ error: 'login required' }, { status: 401 });
  const { order_pk, reason } = await req.json();
  const sb = db();

  const { data: order } = await sb.from('orders').select('pk, member_pk, status').eq('pk', order_pk).single();
  if (!order || order.member_pk !== s.pk) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!['confirmed', 'preparing', 'shipping', 'delivered'].includes(order.status)) {
    return NextResponse.json({ error: '반품을 접수할 수 없는 주문이에요' }, { status: 400 });
  }

  await sb.from('order_return').insert({
    order_pk, member_pk: s.pk, reason: reason || '', status: 'requested', source: 'customer',
  });
  await sb.from('orders').update({ status: 'return_requested' }).eq('pk', order_pk);
  return NextResponse.json({ ok: true });
}
