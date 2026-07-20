import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { RESOURCES } from '../../resources';

function guard(resource) {
  const conf = RESOURCES[resource];
  if (!conf) return { error: NextResponse.json({ error: 'unknown resource' }, { status: 404 }) };
  const session = requireAdmin(conf.perm);
  if (!session) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { conf, session };
}

export async function PATCH(req, { params }) {
  const { conf, error } = guard(params.resource);
  if (error) return error;
  const pk = Number(params.pk);
  const body = await req.json();
  delete body.pk;
  if (params.resource === 'member') {
    if (body.password) body.password = hashPassword(body.password);
    else delete body.password;
  }
  const sb = db();
  const { data, error: dbErr } = await sb.from(conf.table).update(body).eq('pk', pk).select().single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // 반품 처리 부수효과: 승인 → 주문/결제 취소 반영, 거절 → 주문 상태 복원
  if (params.resource === 'order_return' && body.status) {
    if (body.status === 'completed') {
      await sb.from('orders').update({ status: 'return_completed' }).eq('pk', data.order_pk);
      const { data: pays } = await sb.from('payment').select('pk, amount').eq('order_pk', data.order_pk);
      for (const p of pays || []) {
        await sb.from('payment').update({ status: 'canceled', canceled_amount: p.amount }).eq('pk', p.pk);
      }
    } else if (body.status === 'rejected') {
      await sb.from('orders').update({ status: 'delivered' }).eq('pk', data.order_pk);
    }
  }
  return NextResponse.json({ row: data });
}

export async function DELETE(req, { params }) {
  const { conf, error } = guard(params.resource);
  if (error) return error;
  const { error: dbErr } = await db().from(conf.table).delete().eq('pk', Number(params.pk));
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
