import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

/** 세금계산서(외상) 여신 신청 → credit_status = pending */
export async function POST(req) {
  const s = getMemberSession();
  if (!s?.pk) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const sb = db();
  const { data: acc } = await sb.from('wholesale_account').select('pk, status, credit_status').eq('member_pk', s.pk).maybeSingle();
  if (!acc || acc.status !== 'approved') return NextResponse.json({ error: '승인된 도매 회원만 신청할 수 있어요' }, { status: 403 });
  if (acc.credit_status === 'approved') return NextResponse.json({ error: '이미 여신(세금계산서)이 승인된 계정이에요' }, { status: 400 });

  await sb.from('wholesale_account').update({ credit_status: 'pending' }).eq('pk', acc.pk);
  return NextResponse.json({ ok: true });
}
