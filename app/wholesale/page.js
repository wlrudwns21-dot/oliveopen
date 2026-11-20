import { getWholesaleAccount, getWholesaleProducts, getWholesaleCartCount, getWholesaleOrders } from '@/lib/wholesale';
import WholesaleGate from '@/components/WholesaleGate';
import WholesaleShop from '@/components/WholesaleShop';
import { Gate, Btn } from '@/components/WholesaleGates';

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const { session, account } = await getWholesaleAccount();

  if (!session) return <WholesaleGate />;
  if (!account) return <Gate icon="🧾" title="도매 사업자 신청이 필요해요" desc="사업자등록증 인증과 관리자 승인을 거치면 박스 단위·복수 배송지 주문을 이용하실 수 있어요." cta={<Btn href="/wholesale/apply">도매 사업자 신청</Btn>} />;
  if (account.status === 'pending') return <Gate icon="⏳" title="승인 대기 중이에요" desc="제출하신 사업자등록증을 담당자가 확인하고 있어요. 승인되면 바로 주문이 열립니다." />;
  if (account.status === 'rejected') return <Gate icon="❌" title="신청이 반려됐어요" desc={account.reject_reason || '서류를 다시 확인해 주세요. 재신청은 고객센터로 문의 바랍니다.'} />;

  const [products, cartCount, orders] = await Promise.all([
    getWholesaleProducts(),
    getWholesaleCartCount(session.pk),
    getWholesaleOrders(session.pk),
  ]);

  return <WholesaleShop company={account.company_name} products={products} cartCount={cartCount} hasOrders={orders.length > 0} creditStatus={account.credit_status || 'none'} />;
}
