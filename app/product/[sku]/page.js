import { db, imageUrl } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getCartCount, getWishedPks } from '@/lib/shop';
import PdView from '@/components/PdView';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const sb = db();
  const { data: product } = await sb
    .from('product')
    .select('*, product_image(*), product_option(*)')
    .eq('sku', params.sku)
    .single();

  if (!product) {
    return <div className="stage"><div className="phone pg-app"><div className="view"><div className="cartempty"><b>상품을 찾을 수 없어요</b></div></div></div></div>;
  }

  const [{ data: reviews }, cartCount, wished] = await Promise.all([
    sb.from('product_review').select('*').eq('product_pk', product.pk).eq('status', 'approved').order('pk', { ascending: false }).limit(10),
    getCartCount(),
    getWishedPks(),
  ]);

  const thumb = (product.product_image || []).find((i) => i.purpose === 'thumbnail');
  const detail = (product.product_image || []).find((i) => i.purpose === 'detail');
  const options = (product.product_option || [])
    .filter((o) => o.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const p = {
    pk: product.pk,
    sku: product.sku,
    name: product.name,
    sub: product.sub_title || product.description || '',
    origin: product.origin,
    price: product.price,
    was: product.original_price,
    rating: product.rating,
    reviewCount: product.review_count,
    tags: product.badges || [],
    heroImg: imageUrl(thumb?.storage_key),
    detailImg: detail ? imageUrl(detail.storage_key) : null,
  };

  return (
    <PdView
      p={p}
      options={options}
      reviews={reviews || []}
      loggedIn={!!getMemberSession()}
      cartCount={cartCount}
      wished={wished.has(product.pk)}
    />
  );
}
