import { db } from '@/lib/supabase';
import GiftForm from '@/components/GiftForm';

export const dynamic = 'force-dynamic';

export default async function GiftApplyPage() {
  // 선물세트 카테고리 상품 우선, 없으면 전체 활성 상품
  const sb = db();
  const { data: cat } = await sb.from('category').select('pk').eq('slug', 'giftset').maybeSingle();
  let products = [];
  if (cat) {
    const { data } = await sb.from('product').select('pk, name, price').eq('category_pk', cat.pk).eq('status', 'active').order('sort_order');
    products = data || [];
  }
  if (!products.length) {
    const { data } = await sb.from('product').select('pk, name, price').eq('status', 'active').order('sort_order');
    products = data || [];
  }
  return <GiftForm products={products} />;
}
