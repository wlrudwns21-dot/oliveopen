import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

const ROLES = ['manager', 'operator']; // 신청 가능 역할 (마스터는 신청 불가)

export async function POST(req) {
  const { id, password, name, requested_role } = await req.json();
  if (!id || !password || password.length < 8 || !name) {
    return NextResponse.json({ error: '아이디·비밀번호(8자+)·이름을 입력해 주세요' }, { status: 400 });
  }
  const role = ROLES.includes(requested_role) ? requested_role : 'operator';
  const sb = db();
  const { data: exists } = await sb.from('member').select('pk').eq('id', id).maybeSingle();
  if (exists) return NextResponse.json({ error: '이미 사용 중인 아이디예요' }, { status: 409 });

  const { data: member, error } = await sb
    .from('member')
    .insert({ id, password: await hashPassword(password), nick: name })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: rErr } = await sb.from('admin_request').insert({
    member_pk: member.pk, name, requested_role: role, status: 'pending',
  });
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
