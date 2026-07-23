import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { verifyPassword, hashPassword, signSession, MEMBER_COOKIE, cookieOptions } from '@/lib/auth';

export async function POST(req) {
  const { id, password } = await req.json();
  const sb = db();
  const { data: member } = await sb.from('member').select('*').eq('id', id).maybeSingle();
  const { ok, legacy } = member ? await verifyPassword(password || '', member.password) : { ok: false };
  if (!member || !ok || !member.is_active) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
  const patch = { last_login_at: new Date().toISOString() };
  if (legacy) patch.password = await hashPassword(password); // sha256 → bcrypt 자동 전환
  await sb.from('member').update(patch).eq('pk', member.pk);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_COOKIE, signSession({ pk: member.pk, id: member.id, nick: member.nick }), cookieOptions);
  return res;
}
