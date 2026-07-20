import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword, signSession, MEMBER_COOKIE, cookieOptions } from '@/lib/auth';

export async function POST(req) {
  const { id, password } = await req.json();
  const sb = db();
  const { data: member } = await sb.from('member').select('*').eq('id', id).maybeSingle();
  if (!member || member.password !== hashPassword(password || '') || !member.is_active) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
  await sb.from('member').update({ last_login_at: new Date().toISOString() }).eq('pk', member.pk);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_COOKIE, signSession({ pk: member.pk, id: member.id, nick: member.nick }), cookieOptions);
  return res;
}
