'use client';
import Link from 'next/link';
import { won } from '@/lib/format';
import { imageUrl } from '@/lib/supabase';

const CREDIT_LABEL = {
  pending: { txt: '세금계산서(여신) 승인 대기 중', tone: '#9a6a00', bg: '#fff6e0', ic: '⏳' },
  approved: { txt: '세금계산서(후불) 결제 가능 · 월말 정산', tone: '#1f7a3d', bg: '#e8f6ec', ic: '🧾' },
  rejected: { txt: '여신 신청이 반려됐어요', tone: '#b4252e', bg: '#fdeceb', ic: '❌' },
};

const BENEFITS = [
  { ic: '💰', t: '박스 대량 특가', d: '중간 유통 없이\n박스 단위 직거래가' },
  { ic: '🧾', t: '세금계산서·여신', d: '월말 정산\n후불 결제 지원' },
  { ic: '🚚', t: '매장별 배송', d: '한 주문도 여러\n지점으로 분할 배송' },
  { ic: '👩‍💼', t: '전담 매니저', d: '대량·정기 납품\n견적 상담' },
];

function Card({ p }) {
  return (
    <Link href={`/wholesale/product/${p.sku}`} className="ws-card">
      <div className="ws-card-img">
        {p.thumb ? <img src={imageUrl(p.thumb)} alt={p.name} /> : <span style={{ fontSize: 40 }}>{p.emoji || '📦'}</span>}
        {p.is_md_pick && <span className="ws-card-tag">인기</span>}
      </div>
      <div className="ws-card-body">
        {p.origin && <span className="ws-card-origin">{p.origin}</span>}
        <b className="ws-card-name">{p.name}</b>
        <span className="ws-card-box">{p.box_label || '박스'}{p.min_order_box > 1 ? ` · 최소 ${p.min_order_box}박스` : ''}</span>
        <span className="ws-card-price">{won(p.wholesale_price)}원<em>/박스</em></span>
      </div>
    </Link>
  );
}

export default function WholesaleShop({ company, products, cartCount = 0, hasOrders = false, creditStatus = 'none' }) {
  const credit = CREDIT_LABEL[creditStatus];
  const popular = products.filter((p) => p.is_md_pick);

  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead">
        <div className="ht"><h1>도매 전용관</h1><span className="vsub">{company || 'WHOLESALE / B2B'}</span></div>
      </header>

      {/* 히어로 */}
      <div className="ws-hero">
        <span className="ws-hero-eyebrow">OLIVE OPEN · WHOLESALE</span>
        <h2>사장님을 위한<br />과일 도매 직거래</h2>
        <p>새벽 경매 당일 입고 · 박스 단위 특가로<br /><b>{company || '거래처'}</b>님께 바로 보내드려요.</p>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* 여신 상태 */}
        {credit && <div className="ws-credit-chip" style={{ color: credit.tone, background: credit.bg }}>{credit.ic} {credit.txt}</div>}
        {creditStatus === 'none' && <Link href="/wholesale/credit" className="ws-credit-apply">🧾 세금계산서(후불·월말정산) 결제 신청하기 →</Link>}
        {creditStatus === 'rejected' && <Link href="/wholesale/credit" className="ws-credit-apply">🧾 여신 재신청하기 →</Link>}

        {/* 핵심 혜택 */}
        <div className="ws-benefits">
          {BENEFITS.map((b) => (
            <div key={b.t} className="ws-benefit">
              <span className="ws-benefit-ic">{b.ic}</span>
              <b>{b.t}</b>
              <em>{b.d.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</em>
            </div>
          ))}
        </div>

        {!hasOrders && (
          <div className="ws-guide">
            <div className="ws-guide-t">🎉 첫 주문 가이드</div>
            <ul>
              <li>상품을 <b>박스 단위</b>로 담아요 (상품별 최소 수량)</li>
              <li>한 상품도 <b>매장별 여러 주소</b>로 나눠 배송돼요</li>
              <li><b>세금계산서(후불)</b>는 여신 승인 후 선택할 수 있어요</li>
            </ul>
          </div>
        )}
      </div>

      {/* 인기 도매 */}
      {popular.length > 0 && (
        <div style={{ padding: '18px 0 0' }}>
          <h3 className="ws-sec-t" style={{ padding: '0 16px' }}>🔥 인기 도매 상품</h3>
          <div className="ws-hscroll">
            {popular.map((p) => (
              <Link key={p.pk} href={`/wholesale/product/${p.sku}`} className="ws-hcard">
                <div className="ws-hcard-img">{p.thumb ? <img src={imageUrl(p.thumb)} alt={p.name} /> : <span style={{ fontSize: 34 }}>{p.emoji || '📦'}</span>}</div>
                <b>{p.name}</b>
                <span className="ws-card-box">{p.box_label}</span>
                <span className="ws-card-price">{won(p.wholesale_price)}원<em>/박스</em></span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 전체 도매 상품 */}
      <div style={{ padding: '18px 16px 0' }}>
        <h3 className="ws-sec-t">📦 전체 도매 상품 <span>{products.length}</span></h3>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13.5 }}>등록된 도매 상품이 아직 없어요.</div>
        ) : (
          <div className="ws-grid">{products.map((p) => <Card key={p.pk} p={p} />)}</div>
        )}
      </div>

      {/* 견적·상담 */}
      <div style={{ padding: '18px 16px 8px' }}>
        <div className="ws-quote">
          <div>
            <b>대량·정기 납품 견적이 필요하세요?</b>
            <span>전담 매니저가 품목·수량에 맞춰 단가를 제안해 드려요.</span>
          </div>
          <Link href="/wholesale/credit" className="ws-quote-btn">문의하기</Link>
        </div>
      </div>
    </div>

    <nav className="ws-tabbar">
      <Link href="/wholesale/orders" className="ws-tab">🧾<span>주문 내역</span></Link>
      <Link href="/wholesale/cart" className="ws-tab">🛒<span>장바구니</span>{cartCount > 0 && <em className="ws-badge">{cartCount}</em>}</Link>
      <Link href="/" className="ws-tab">🏠<span>일반몰</span></Link>
    </nav>
    </div></div>
  );
}
