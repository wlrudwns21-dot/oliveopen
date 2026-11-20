import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { WHOLESALE_BUCKET } from '@/lib/wholesale';

/** 관리자 전용: 사업자등록증 비공개 파일의 임시 열람 URL 발급 → 리다이렉트 */
export async function GET(req) {
  if (!requireAdmin('MANAGE_MEMBERS')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const key = new URL(req.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'no key' }, { status: 400 });
  const sb = db();
  const { data, error } = await sb.storage.from(WHOLESALE_BUCKET).createSignedUrl(key, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: error?.message || '파일을 찾을 수 없어요' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
