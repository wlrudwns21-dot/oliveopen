import { db } from '@/lib/supabase';
import GiftForm from '@/components/GiftForm';

export const dynamic = 'force-dynamic';

export default async function GiftApplyPage() {
  const sb = db();
  const [{ data: cat }, { data: event }] = await Promise.all([
    sb.from('category').select('pk').eq('slug', 'giftset').maybeSingle(),
    sb.from('event').select('title, subtitle, badge, theme, hero_image').eq('slug', 'chuseok').maybeSingle(),
  ]);
  let products = [];
  if (cat) {
    const { data } = await sb.from('product').select('pk, name, price').eq('category_pk', cat.pk).eq('status', 'active').order('sort_order');
    products = data || [];
  }
  if (!products.length) {
    const { data } = await sb.from('product').select('pk, name, price').eq('status', 'active').order('sort_order');
    products = data || [];
  }
  return <GiftForm products={products} event={event || null} />;
}
