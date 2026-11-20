import Link from 'next/link';
import { getWholesaleAccount, getWholesaleOrders } from '@/lib/wholesale';
import WholesaleGate from '@/components/WholesaleGate';
import { Gate, Btn } from '@/components/WholesaleGates';
import { won, dt } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS = { pending: ['접수', '#9a6a00', '#fff6e0'], confirmed: ['확인', '#1f5fa8', '#e7f0fb'], shipped: ['배송중', '#1f7a3d', '#e8f6ec'], done: ['완료', '#4b5563', '#eef0f2'], canceled: ['취소', '#b4252e', '#fdeceb'] };

export default async function Page() {
  const { session, account } = await getWholesaleAccount();
  if (!session) return <WholesaleGate />;
  if (!account || account.status !== 'approved') {
    return <Gate icon="🔒" title="승인된 도매 회원만 볼 수 있어요" desc="도매 사업자 승인 후 주문 내역을 확인할 수 있어요." cta={<Btn href="/wholesale">도매관으로</Btn>} />;
  }
  const orders = await getWholesaleOrders(session.pk);

  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/wholesale" className="ws-back">←</Link>
          <div className="ht"><h1 style={{ fontSize: 17 }}>도매 주문 내역</h1><span className="vsub">{account.company_name}</span></div>
        </div>
      </header>

      <div style={{ padding: '14px 16px 28px' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 46 }}>🧾</div>
            <p style={{ marginTop: 12, fontSize: 13.5 }}>아직 주문 내역이 없어요.</p>
            <Link href="/wholesale" className="authbtn" style={{ display: 'inline-flex', justifyContent: 'center', marginTop: 18, textDecoration: 'none', padding: '0 24px' }}>도매 상품 보러가기</Link>
          </div>
        ) : orders.map((o) => {
          const [slabel, stone, sbg] = STATUS[o.status] || STATUS.pending;
          const items = o.items || [];
          return (
            <div key={o.pk} className="ws-order-card">
              <div className="ws-order-card-top">
                <div>
                  <b>{o.order_no}</b>
                  <span>{dt(o.created_at)}</span>
                </div>
                <span className="ws-status" style={{ color: stone, background: sbg }}>{slabel}</span>
              </div>
              <div className="ws-order-card-meta">
                <span>{o.payment_method === 'tax_invoice' ? '🧾 세금계산서(후불)' : '💳 일반 결제'}</span>
                {o.manager_name && <span>담당 {o.manager_name}</span>}
                <span>{o.box_total}박스 · 배송지 {items.length}곳</span>
              </div>
              <div className="ws-order-card-items">
                {items.map((it) => (
                  <div key={it.pk} className="ws-order-card-item">
                    <span className="nm">{it.product_name} · {it.box_qty}박스</span>
                    <span className="to">→ {it.recipient_name} ({(it.address || '').slice(0, 14)}…)</span>
                  </div>
                ))}
              </div>
              <div className="ws-order-card-total"><span>합계</span><b>{won(o.total)}원</b></div>
            </div>
          );
        })}
      </div>
    </div></div></div>
  );
}
