import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

function unauth() { return NextResponse.json({ error: 'login required' }, { status: 401 }); }

export async function GET() {
  const s = getMemberSession();
  if (!s) return unauth();
  const { data } = await db()
    .from('inquiry')
    .select('*')
    .eq('member_pk', s.pk)
    .order('pk', { ascending: false });
  return NextResponse.json({ inquiries: data || [] });
}

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return unauth();
  const { category, title, body } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해 주세요' }, { status: 400 });
  const { data, error } = await db().from('inquiry').insert({
    member_pk: s.pk, category: category || 'general', title: title.trim(), body: body || '',
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inquiry: data });
}
