import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

export async function GET() {
  const s = getMemberSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sb = db();
  const { data: member } = await sb.from('member').select('pk, id, nick, grade, points, extra').eq('pk', s.pk).single();
  const { data: defAddr } = await sb
    .from('member_address')
    .select('recipient, phone, zipcode, address, detail_address')
    .eq('member_pk', s.pk)
    .eq('is_default', true)
    .maybeSingle();

  const extra = member?.extra || {};
  const address = defAddr || {
    recipient: member?.nick || '',
    phone: extra.phone || '',
    zipcode: extra.zipcode || '',
    address: extra.address || '',
    detail_address: extra.detail_address || '',
  };
  return NextResponse.json({ member, address });
}
