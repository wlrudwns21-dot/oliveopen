import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { WHOLESALE_BUCKET, ensureWholesaleBucket } from '@/lib/wholesale';

/** 사업자등록증 업로드 (가입 전이라 익명 허용). 비공개 버킷에 저장하고 key만 반환. */
export async function POST(req) {
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: '파일이 없어요' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '10MB 이하만 업로드할 수 있어요' }, { status: 400 });

  const sb = db();
  await ensureWholesaleBucket(sb);
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `cert/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(WHOLESALE_BUCKET).upload(key, buffer, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 신청자 본인 확인용 임시 미리보기 URL (10분)
  const { data: signed } = await sb.storage.from(WHOLESALE_BUCKET).createSignedUrl(key, 600);
  return NextResponse.json({ key, preview: signed?.signedUrl || null });
}
