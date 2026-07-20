import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';

export async function POST(req) {
  const s = getMemberSession();
  if (!s) return NextResponse.json({ error: 'login required' }, { status: 401 });
  const { product_pk } = await req.json();
  const sb = db();
  const { data: exists } = await sb
    .from('wishlist').select('pk').eq('member_pk', s.pk).eq('product_pk', product_pk).maybeSingle();
  if (exists) {
    await sb.from('wishlist').delete().eq('pk', exists.pk);
    return NextResponse.json({ added: false });
  }
  await sb.from('wishlist').insert({ member_pk: s.pk, product_pk });
  return NextResponse.json({ added: true });
}
