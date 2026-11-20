'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { won } from '@/lib/format';
import { imageUrl } from '@/lib/supabase';
import Toaster, { toast } from './Toaster';

export default function WholesaleProductDetail({ product, inCartQty = 0, related = [] }) {
  const router = useRouter();
  const min = product.min_order_box || 1;
  const [qty, setQty] = useState(min);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(inCartQty > 0);
  const q = parseInt(qty, 10) || 0;
  const line = (product.wholesale_price || 0) * q;
  const retail = product.price || 0;

  async function add(go) {
    const n = Math.max(parseInt(qty, 10) || 0, min);
    setBusy(true);
    const res = await fetch('/api/wholesale/cart', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_pk: product.pk, box_qty: n, mode: 'add' }),
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); toast(j.error || '담기에 실패했어요'); return; }
    setAdded(true);
    if (go) { router.push('/wholesale/cart'); return; }
    toast(`장바구니에 ${n}박스 담았어요`);
    router.refresh();
  }

  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <Link href="/wholesale" className="ws-back" style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff' }}>←</Link>
          <div className="ht"><h1 style={{ fontSize: 16 }}>도매 상품</h1><span className="vsub">WHOLESALE / B2B</span></div>
        </div>
      </header>

      <div className="ws-detail-img">
        {product.thumb ? <img src={imageUrl(product.thumb)} alt={product.name} /> : <span style={{ fontSize: 76 }}>{product.emoji || '📦'}</span>}
        <span className="ws-detail-badge">도매 전용가</span>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {product.origin && <span className="ws-card-origin">📍 {product.origin}</span>}
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: '7px 0 4px', letterSpacing: '-0.4px' }}>{product.name}</h2>
        {product.sub_title && <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{product.sub_title}</p>}
        {product.review_count > 0 && <div style={{ fontSize: 12.5, color: 'var(--green2)', fontWeight: 700, marginTop: 6 }}>★ {product.rating} · 일반몰 리뷰 {product.review_count.toLocaleString()}개</div>}

        {/* 도매가 */}
        <div className="ws-pricebox">
          <div className="ws-pricebox-main">
            <span>도매가 (박스당)</span>
            <b>{won(product.wholesale_price)}<em>원</em></b>
          </div>
          {retail > 0 && <div className="ws-pricebox-sub">일반 소비자가 <s>{won(retail)}원</s> 대비 <b>박스 단위 직거래가</b></div>}
          <div className="ws-pricebox-tags">
            <span>{product.box_label || '박스'}</span>
            <span>최소 {min}박스</span>
          </div>
        </div>

        {/* 대량 구매 안내 */}
        <div className="infocard">
          <h3 className="ws-h">대량 구매 안내</h3>
          <div className="ws-tier"><span className="ws-tier-q">{min}박스~</span><span className="ws-tier-p">기본 도매가 {won(product.wholesale_price)}원/박스</span></div>
          <div className="ws-tier"><span className="ws-tier-q">10박스~</span><span className="ws-tier-p">대량 추가 할인 상담</span></div>
          <div className="ws-tier"><span className="ws-tier-q">50박스~</span><span className="ws-tier-p">전담 매니저 특별 견적</span></div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>정기 납품·대량 주문은 주문 메모 또는 전담 매니저 상담으로 별도 단가를 제안해 드려요.</p>
        </div>

        {product.description && (
          <div className="infocard">
            <h3 className="ws-h">상품 소개</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{product.description}</p>
          </div>
        )}

        {/* 배송·정산 */}
        <div className="infocard">
          <h3 className="ws-h">배송 · 정산 안내</h3>
          <div className="ws-info-row"><b>🚚 당일 산지직송</b><span>새벽 경매 입고분을 콜드체인으로 당일 출고</span></div>
          <div className="ws-info-row"><b>📦 매장별 복수배송</b><span>한 주문도 박스 단위로 여러 지점에 나눠 배송</span></div>
          <div className="ws-info-row"><b>🧾 세금계산서·여신</b><span>여신 승인 시 월말 정산 후불 결제 가능</span></div>
          <div className="ws-info-row"><b>🔄 신선 보장</b><span>품질 이상 시 사진 확인 후 교환·보상</span></div>
        </div>

        {/* 수량 */}
        <div className="infocard">
          <h3 className="ws-h">주문 수량 (박스)</h3>
          <div className="ws-stepper">
            <button type="button" onClick={() => setQty((v) => Math.max((parseInt(v, 10) || 0) - 1, min))}>−</button>
            <input type="number" min={min} value={qty} onChange={(e) => setQty(e.target.value)} />
            <button type="button" onClick={() => setQty((v) => (parseInt(v, 10) || 0) + 1)}>+</button>
            <span className="ws-line">= {won(line)}원</span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>최소 {min}박스부터 · 배송지 분할(매장별 다른 주소)은 장바구니에서 설정해요.</p>
        </div>

        {/* 관련 상품 */}
        {related.length > 0 && (
          <div style={{ margin: '4px -16px 0' }}>
            <h3 className="ws-sec-t" style={{ padding: '0 16px' }}>함께 담는 도매 상품</h3>
            <div className="ws-hscroll">
              {related.map((p) => (
                <Link key={p.pk} href={`/wholesale/product/${p.sku}`} className="ws-hcard">
                  <div className="ws-hcard-img">{p.thumb ? <img src={imageUrl(p.thumb)} alt={p.name} /> : <span style={{ fontSize: 30 }}>{p.emoji || '📦'}</span>}</div>
                  <b>{p.name}</b>
                  <span className="ws-card-box">{p.box_label}</span>
                  <span className="ws-card-price">{won(p.wholesale_price)}원<em>/박스</em></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Toaster />
    </div>

    <div className="ws-detail-bar">
      {added && <Link href="/wholesale/cart" className="btn btn-line" style={{ flex: '0 0 auto', padding: '0 15px', display: 'inline-flex', alignItems: 'center' }}>장바구니</Link>}
      <button className="authbtn" style={{ margin: 0, flex: 1 }} disabled={busy} onClick={() => add(false)}>{busy ? '담는 중…' : '장바구니 담기'}</button>
      <button className="authbtn ws-btn-dark" style={{ margin: 0, flex: 1 }} disabled={busy} onClick={() => add(true)}>바로 주문</button>
    </div>
    </div></div>
  );
}
