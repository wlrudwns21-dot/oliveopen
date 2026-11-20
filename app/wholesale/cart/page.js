import { getWholesaleAccount, getWholesaleCart } from '@/lib/wholesale';
import WholesaleGate from '@/components/WholesaleGate';
import { Gate, Btn } from '@/components/WholesaleGates';
import WholesaleCart from '@/components/WholesaleCart';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { session, account } = await getWholesaleAccount();
  if (!session) return <WholesaleGate />;
  if (!account || account.status !== 'approved') {
    return <Gate icon="🔒" title="승인된 도매 회원만 이용할 수 있어요" desc="도매 사업자 승인 후 장바구니·주문을 이용할 수 있어요." cta={<Btn href="/wholesale">도매관으로</Btn>} />;
  }
  const items = await getWholesaleCart(session.pk);
  return <WholesaleCart items={items} account={account} />;
}
