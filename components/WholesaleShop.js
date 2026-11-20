'use client';
import Link from 'next/link';
import { won } from '@/lib/format';
import { imageUrl } from '@/lib/supabase';

const CREDIT_LABEL = {
  none: null,
  pending: { txt: '세금계산서(여신) 승인 대기 중', tone: '#9a6a00', bg: '#fff6e0' },
  approved: { txt: '세금계산서(후불) 결제 가능', tone: '#1f7a3d', bg: '#e8f6ec' },
  rejected: { txt: '여신 신청이 반려됐어요', tone: '#b4252e', bg: '#fdeceb' },
};

export default function WholesaleShop({ company, products, cartCount = 0, hasOrders = false, creditStatus = 'none' }) {
  const credit = CREDIT_LABEL[creditStatus];

  return (
    <div className="stage"><div className="phone pg-app" style={{ paddingBottom: 72 }}><div className="view">
      <header className="viewhead">
        <div className="ht"><h1>도매 전용관</h1><span className="vsub">{company || 'WHOLESALE / B2B'}</span></div>
      </header>

      <div style={{ padding: '12px 16px 18px' }}>
        {!hasOrders && (
          <div className="ws-guide">
            <div className="ws-guide-t">🎉 도매 전용관에 오신 걸 환영해요</div>
            <ul>
              <li><b>박스 단위</b>로 담아 주문해요 (상품마다 최소 수량이 있어요)</li>
              <li>한 상품도 <b>10kg씩 여러 주소</b>로 나눠 보낼 수 있어요</li>
              <li><b>세금계산서(후불)</b> 결제는 여신 승인 후 이용 가능해요</li>
            </ul>
          </div>
        )}

        {credit && (
          <div className="ws-credit-chip" style={{ color: credit.tone, background: credit.bg }}>
            {creditStatus === 'approved' ? '🧾 ' : creditStatus === 'pending' ? '⏳ ' : '❌ '}{credit.txt}
          </div>
        )}
        {creditStatus === 'none' && (
          <Link href="/wholesale/credit" className="ws-credit-apply">🧾 세금계산서(후불) 결제 신청하기 →</Link>
        )}

        <h2 className="ws-sec-t">도매 상품 <span>{products.length}</span></h2>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13.5 }}>등록된 도매 상품이 아직 없어요.</div>
        ) : (
          <div className="ws-grid">
            {products.map((p) => (
              <Link key={p.pk} href={`/wholesale/product/${p.sku}`} className="ws-card">
                <div className="ws-card-img">
                  {p.thumb ? <img src={imageUrl(p.thumb)} alt={p.name} /> : <span style={{ fontSize: 40 }}>{p.emoji || '📦'}</span>}
                </div>
                <div className="ws-card-body">
                  {p.origin && <span className="ws-card-origin">{p.origin}</span>}
                  <b className="ws-card-name">{p.name}</b>
                  <span className="ws-card-box">{p.box_label || '박스'}{p.min_order_box > 1 ? ` · 최소 ${p.min_order_box}박스` : ''}</span>
                  <span className="ws-card-price">{won(p.wholesale_price)}원<em>/박스</em></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="ws-tabbar">
        <Link href="/wholesale/orders" className="ws-tab">🧾<span>주문 내역</span></Link>
        <Link href="/wholesale/cart" className="ws-tab ws-tab-cart">
          🛒<span>장바구니</span>
          {cartCount > 0 && <em className="ws-badge">{cartCount}</em>}
        </Link>
        <Link href="/" className="ws-tab">🏠<span>일반몰</span></Link>
      </div>
    </div></div></div>
  );
}
