import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword, getMemberSession } from '@/lib/auth';

export async function POST(req) {
  const b = await req.json();
  const biz = (b.business_no || '').replace(/[^0-9]/g, '');
  if (!b.company_name?.trim() || biz.length !== 10) {
    return NextResponse.json({ error: '상호와 사업자등록번호(10자리)를 정확히 입력해 주세요' }, { status: 400 });
  }
  if (!b.cert_key) return NextResponse.json({ error: '사업자등록증 이미지를 업로드해 주세요' }, { status: 400 });

  const sb = db();
  const sess = getMemberSession();
  let memberPk;

  if (sess?.pk) {
    // 이미 로그인한 일반 회원 → 도매 전환 신청
    memberPk = sess.pk;
    const { data: dup } = await sb.from('wholesale_account').select('pk, status').eq('member_pk', memberPk).maybeSingle();
    if (dup) return NextResponse.json({ error: dup.status === 'approved' ? '이미 승인된 도매 회원이에요' : '이미 신청이 접수돼 있어요' }, { status: 409 });
  } else {
    // 신규 가입 (아이디/비번 필요)
    if (!b.id?.trim() || !b.password || b.password.length < 8) {
      return NextResponse.json({ error: '아이디와 비밀번호(8자 이상)를 입력해 주세요' }, { status: 400 });
    }
    const { data: exists } = await sb.from('member').select('pk').eq('id', b.id.trim()).maybeSingle();
    if (exists) return NextResponse.json({ error: '이미 사용 중인 아이디예요' }, { status: 409 });
    const { data: m, error: mErr } = await sb.from('member').insert({
      id: b.id.trim(), password: await hashPassword(b.password), nick: b.company_name.trim(),
      extra: { phone: b.contact_phone || '', wholesale: true },
    }).select().single();
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
    memberPk = m.pk;
    await sb.from('member_group_mapping').insert({ local_member_pk: memberPk, local_member_group_pk: 2 });
  }

  const { error } = await sb.from('wholesale_account').insert({
    member_pk: memberPk,
    company_name: b.company_name.trim(),
    business_no: biz,
    owner_name: b.owner_name?.trim() || null,
    contact_phone: b.contact_phone?.trim() || null,
    contact_email: b.contact_email?.trim() || null,
    zipcode: b.zipcode || null, address: b.address?.trim() || null, detail_address: b.detail_address?.trim() || null,
    cert_key: b.cert_key, status: 'pending',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, logged_in: !!sess?.pk });
}
