import { getWholesaleAccount } from '@/lib/wholesale';
import WholesaleApplyForm from '@/components/WholesaleApplyForm';

export const dynamic = 'force-dynamic';

export default async function WholesaleApplyPage() {
  const { session, account } = await getWholesaleAccount();
  return <WholesaleApplyForm loggedIn={!!session} existing={account} />;
}
