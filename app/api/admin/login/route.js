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
  // 파트너 계정 우선 확인
  const { data: partner } = await sb.from('partner').select('status, referral_code, company').eq('member_pk', member.pk).maybeSingle();
  let payload;
  if (partner) {
    if (partner.status === 'pending') return NextResponse.json({ error: '파트너 승인 대기 중이에요. 마스터 승인 후 이용 가능합니다.' }, { status: 403 });
    if (partner.status === 'rejected') return NextResponse.json({ error: '승인이 거절된 파트너 계정이에요.' }, { status: 403 });
    if (!partner.referral_code) return NextResponse.json({ error: '추천인 코드가 아직 배정되지 않았어요. 마스터에게 문의하세요.' }, { status: 403 });
    payload = { pk: member.pk, id: member.id, nick: member.nick, isPartner: true, referralCode: partner.referral_code, company: partner.company || member.nick };
  } else {
    payload = await buildAdminPayload(member);
    if (!payload) {
      // 어드민 신청 상태 확인 → 친절한 메시지
      const { data: areq } = await sb.from('admin_request').select('status').eq('member_pk', member.pk).maybeSingle();
      if (areq?.status === 'pending') return NextResponse.json({ error: '어드민 승인 대기 중이에요. 마스터 승인 후 로그인할 수 있어요.' }, { status: 403 });
      if (areq?.status === 'rejected') return NextResponse.json({ error: '어드민 신청이 거절됐어요.' }, { status: 403 });
      return NextResponse.json({ error: '관리자 권한이 없는 계정이에요' }, { status: 403 });
    }
  }

  const patch = { last_login_at: new Date().toISOString() };
  if (legacy) patch.password = await hashPassword(password);
  await sb.from('member').update(patch).eq('pk', member.pk);
  const res = NextResponse.json({ ok: true, session: payload });
  res.cookies.set(ADMIN_COOKIE, signSession(payload), cookieOptions);
  return res;
}
