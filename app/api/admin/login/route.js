import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { verifyPassword, hashPassword, signSession, buildAdminPayload, ADMIN_COOKIE, cookieOptions } from '@/lib/auth';

export async function POST(req) {
  const { id, password } = await req.json();
  const sb = db();
  const { data: member } = await sb.from('member').select('*').eq('id', id).maybeSingle();
  const { ok, legacy } = member ? await verifyPassword(password || '', member.password) : { ok: false };
  if (!member || !ok || !member.is_active) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않아요' }, { status: 401 });
  }
  const payload = await buildAdminPayload(member);
  if (!payload) return NextResponse.json({ error: '관리자 권한이 없는 계정이에요' }, { status: 403 });

  const patch = { last_login_at: new Date().toISOString() };
  if (legacy) patch.password = await hashPassword(password);
  await sb.from('member').update(patch).eq('pk', member.pk);
  const res = NextResponse.json({ ok: true, session: payload });
  res.cookies.set(ADMIN_COOKIE, signSession(payload), cookieOptions);
  return res;
}
