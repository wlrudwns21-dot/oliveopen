import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

const BUCKET = 'product-images';

export async function POST(req) {
  if (!requireAdmin()) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: '파일이 없어요' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '이미지는 10MB 이하만 업로드할 수 있어요' }, { status: 400 });
  }

  const sb = db();
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  // 파일명 충돌 방지 (Math.random/Date.now 사용 불가한 환경이 아니므로 표준 사용)
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(key, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = sb.storage.from(BUCKET).getPublicUrl(key);
  return NextResponse.json({ url: data.publicUrl });
}
