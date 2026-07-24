import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword, signSession, MEMBER_COOKIE, cookieOptions } from '@/lib/auth';

export async function POST(req) {
  const body = await req.json();
  const { id, password, nick, phone, address, detail_address, referral_code } = body;
  if (!id || !password || password.length < 8 || !nick) {
    return NextResponse.json({ error: '입력값을 확인해 주세요' }, { status: 400 });
  }
  const sb = db();
  const { data: exists } = await sb.from('member').select('pk').eq('id', id).maybeSingle();
  if (exists) return NextResponse.json({ error: '이미 사용 중인 아이디예요' }, { status: 409 });

  // 추천인 코드 검증 (활성 추천 쿠폰)
  let refCode = null;
  let referredBy = null;
  if (referral_code?.trim()) {
    const code = referral_code.trim();
    const { data: cp } = await sb.from('coupon').select('code, referrer, is_active, is_referral').eq('code', code).maybeSingle();
    if (!cp || !cp.is_referral || !cp.is_active) {
      return NextResponse.json({ error: '유효하지 않은 추천인 코드예요' }, { status: 400 });
    }
    refCode = cp.code;
    referredBy = cp.referrer || null;
  }

  const { data: member, error } = await sb
    .from('member')
    .insert({
      id,
      password: await hashPassword(password),
      nick,
      extra: { phone: phone || '', address: address || '', detail_address: detail_address || '' },
      referral_code: refCode,
      referred_by: referredBy,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 기본 그룹: Guest(2)
  await sb.from('member_group_mapping').insert({ local_member_pk: member.pk, local_member_group_pk: 2 });
  if (address) {
    await sb.from('member_address').insert({
      member_pk: member.pk, label: '기본 배송지', recipient: nick, phone: phone || '',
      address, detail_address: detail_address || '', is_default: true,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_COOKIE, signSession({ pk: member.pk, id: member.id, nick: member.nick }), cookieOptions);
  return res;
}
