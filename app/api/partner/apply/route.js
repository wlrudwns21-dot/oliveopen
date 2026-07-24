import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(req) {
  const { id, password, company, contact } = await req.json();
  if (!id || !password || password.length < 8 || !company) {
    return NextResponse.json({ error: '아이디·비밀번호(8자+)·파트너명을 입력해 주세요' }, { status: 400 });
  }
  const sb = db();
  const { data: exists } = await sb.from('member').select('pk').eq('id', id).maybeSingle();
  if (exists) return NextResponse.json({ error: '이미 사용 중인 아이디예요' }, { status: 409 });

  const { data: member, error } = await sb
    .from('member')
    .insert({ id, password: await hashPassword(password), nick: company, extra: { contact: contact || '' } })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 파트너 그룹(6) + 파트너 신청(pending)
  await sb.from('member_group_mapping').insert({ local_member_pk: member.pk, local_member_group_pk: 6 });
  const { error: pErr } = await sb.from('partner').insert({
    member_pk: member.pk, company, contact: contact || null, status: 'pending',
  });
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
