import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

function unauth() { return NextResponse.json({ error: 'login required' }, { status: 401 }); }

export async function GET() {
  const s = getMemberSession();
  if (!s) return unauth();
  const { data } = await db()
    .from('member_address')
    .select('*')
    .eq('member_pk', s.pk)
    .order('is_default', { ascending: false })
    .order('pk');
  return NextResponse.json({ addresses: data || [] });
}

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return unauth();
  const b = await req.json();
  if (!b.recipient || !b.phone || !b.address) {
    return NextResponse.json({ error: '받는분·연락처·주소는 필수예요' }, { status: 400 });
  }
  const sb = db();
  const { count } = await sb.from('member_address').select('pk', { count: 'exact', head: true }).eq('member_pk', s.pk);
  const makeDefault = b.is_default || (count || 0) === 0;
  if (makeDefault) await sb.from('member_address').update({ is_default: false }).eq('member_pk', s.pk);
  const { data, error } = await sb.from('member_address').insert({
    member_pk: s.pk, label: b.label || '배송지', recipient: b.recipient, phone: b.phone,
    zipcode: b.zipcode || null, address: b.address, detail_address: b.detail_address || null,
    is_default: makeDefault,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

export async function PATCH(req) {
  const s = getMemberSession();
  if (!s) return unauth();
  const b = await req.json();
  const sb = db();
  if (b.is_default) await sb.from('member_address').update({ is_default: false }).eq('member_pk', s.pk);
  const patch = {};
  ['label', 'recipient', 'phone', 'zipcode', 'address', 'detail_address', 'is_default'].forEach((k) => {
    if (b[k] !== undefined) patch[k] = b[k];
  });
  const { data, error } = await sb.from('member_address').update(patch).eq('pk', b.pk).eq('member_pk', s.pk).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

export async function DELETE(req) {
  const s = getMemberSession();
  if (!s) return unauth();
  const { pk } = await req.json();
  const sb = db();
  const { data: target } = await sb.from('member_address').select('is_default').eq('pk', pk).eq('member_pk', s.pk).single();
  await sb.from('member_address').delete().eq('pk', pk).eq('member_pk', s.pk);
  // 기본 배송지를 지웠으면 남은 것 중 하나를 기본으로
  if (target?.is_default) {
    const { data: rest } = await sb.from('member_address').select('pk').eq('member_pk', s.pk).order('pk').limit(1);
    if (rest?.[0]) await sb.from('member_address').update({ is_default: true }).eq('pk', rest[0].pk);
  }
  return NextResponse.json({ ok: true });
}
