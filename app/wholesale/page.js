import Link from 'next/link';
import { getWholesaleAccount, getWholesaleProducts } from '@/lib/wholesale';
import WholesaleOrder from '@/components/WholesaleOrder';

export const dynamic = 'force-dynamic';

function Gate({ icon, title, desc, cta }) {
  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead"><div className="ht"><h1>도매 전용관</h1><span className="vsub">WHOLESALE / B2B</span></div></header>
      <div style={{ textAlign: 'center', padding: '56px 28px' }}>
        <div style={{ fontSize: 54 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 8px' }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</p>
        {cta}
      </div>
    </div></div></div>
  );
}
const Btn = ({ href, children }) => <Link href={href} className="authbtn" style={{ display: 'inline-flex', justifyContent: 'center', marginTop: 22, textDecoration: 'none' }}>{children}</Link>;

export default async function WholesalePage() {
  const { session, account } = await getWholesaleAccount();

  if (!session) return <Gate icon="🔑" title="도매 회원 전용관이에요" desc="로그인 후 이용하실 수 있어요. 도매 회원이 아니시면 사업자 신청을 먼저 해주세요." cta={<><Btn href="/login">로그인</Btn><div style={{ marginTop: 10 }}><Link href="/wholesale/apply" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green2)' }}>도매 사업자 신청하기 →</Link></div></>} />;
  if (!account) return <Gate icon="🧾" title="도매 사업자 신청이 필요해요" desc="사업자등록증 인증과 관리자 승인을 거치면 박스 단위·복수 배송지 주문을 이용하실 수 있어요." cta={<Btn href="/wholesale/apply">도매 사업자 신청</Btn>} />;
  if (account.status === 'pending') return <Gate icon="⏳" title="승인 대기 중이에요" desc="제출하신 사업자등록증을 담당자가 확인하고 있어요. 승인되면 바로 주문이 열립니다." />;
  if (account.status === 'rejected') return <Gate icon="❌" title="신청이 반려됐어요" desc={account.reject_reason || '서류를 다시 확인해 주세요. 재신청은 고객센터로 문의 바랍니다.'} />;

  const products = await getWholesaleProducts();
  return <WholesaleOrder products={products} company={account.company_name} />;
}
