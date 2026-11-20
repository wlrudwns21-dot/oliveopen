import { getWholesaleAccount, getWholesaleProduct } from '@/lib/wholesale';
import { db } from '@/lib/supabase';
import WholesaleGate from '@/components/WholesaleGate';
import { Gate, Btn } from '@/components/WholesaleGates';
import WholesaleProductDetail from '@/components/WholesaleProductDetail';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { session, account } = await getWholesaleAccount();
  if (!session) return <WholesaleGate />;
  if (!account || account.status !== 'approved') {
    return <Gate icon="🔒" title="승인된 도매 회원만 볼 수 있어요" desc="도매 사업자 승인 후 상품을 담고 주문할 수 있어요." cta={<Btn href="/wholesale">도매관으로</Btn>} />;
  }
  const product = await getWholesaleProduct(params.sku);
  if (!product) return <Gate icon="🔍" title="상품을 찾을 수 없어요" desc="도매 전용 상품이 아니거나 판매가 중지됐어요." cta={<Btn href="/wholesale">도매관으로</Btn>} />;

  const sb = db();
  const { data: c } = await sb.from('wholesale_cart').select('box_qty').eq('member_pk', session.pk).eq('product_pk', product.pk).maybeSingle();

  return <WholesaleProductDetail product={product} inCartQty={c?.box_qty || 0} />;
}
