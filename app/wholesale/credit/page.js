import { getWholesaleAccount } from '@/lib/wholesale';
import WholesaleGate from '@/components/WholesaleGate';
import { Gate, Btn } from '@/components/WholesaleGates';
import WholesaleCredit from '@/components/WholesaleCredit';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { session, account } = await getWholesaleAccount();
  if (!session) return <WholesaleGate />;
  if (!account || account.status !== 'approved') {
    return <Gate icon="🔒" title="승인된 도매 회원만 이용할 수 있어요" desc="도매 사업자 승인 후 세금계산서(여신)를 신청할 수 있어요." cta={<Btn href="/wholesale">도매관으로</Btn>} />;
  }
  return <WholesaleCredit status={account.credit_status || 'none'} limit={account.credit_limit || 0} company={account.company_name} />;
}
