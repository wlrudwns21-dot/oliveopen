'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { won } from '@/lib/format';
import { imageUrl } from '@/lib/supabase';
import Toaster, { toast } from './Toaster';

export default function WholesaleProductDetail({ product, inCartQty = 0 }) {
  const router = useRouter();
  const min = product.min_order_box || 1;
  const [qty, setQty] = useState(min);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(inCartQty > 0);
  const line = (product.wholesale_price || 0) * (parseInt(qty, 10) || 0);
  const retail = product.price || 0;

  async function add(go) {
    const q = Math.max(parseInt(qty, 10) || 0, min);
    setBusy(true);
    const res = await fetch('/api/wholesale/cart', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_pk: product.pk, box_qty: q, mode: 'add' }),
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); toast(j.error || '담기에 실패했어요'); return; }
    setAdded(true);
    if (go) { router.push('/wholesale/cart'); return; }
    toast(`장바구니에 ${q}박스 담았어요`);
    router.refresh();
  }

  return (
    <div className="stage"><div className="phone pg-app" style={{ paddingBottom: 90 }}><div className="view">
      <header className="viewhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/wholesale" className="ws-back">←</Link>
          <div className="ht"><h1 style={{ fontSize: 17 }}>도매 상품</h1><span className="vsub">WHOLESALE / B2B</span></div>
        </div>
      </header>

      <div className="ws-detail-img">
        {product.thumb ? <img src={imageUrl(product.thumb)} alt={product.name} /> : <span style={{ fontSize: 72 }}>{product.emoji || '📦'}</span>}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {product.origin && <span className="ws-card-origin">📍 {product.origin}</span>}
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: '8px 0 4px', letterSpacing: '-0.4px' }}>{product.name}</h2>
        {product.sub_title && <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{product.sub_title}</p>}

        <div className="infocard" style={{ marginTop: 14 }}>
          <div className="ws-price-row"><span>도매가 (박스당)</span><b style={{ fontSize: 20, color: 'var(--green-ink)' }}>{won(product.wholesale_price)}원</b></div>
          <div className="ws-price-row"><span>박스 규격</span><b>{product.box_label || '박스'}</b></div>
          <div className="ws-price-row"><span>최소 주문</span><b>{min}박스</b></div>
          {retail > 0 && <div className="ws-price-row"><span>일반 소비자가</span><s style={{ color: 'var(--muted)' }}>{won(retail)}원</s></div>}
        </div>

        {product.description && (
          <div className="infocard">
            <h3 className="ws-h">상품 설명</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{product.description}</p>
          </div>
        )}

        <div className="infocard">
          <h3 className="ws-h">주문 수량 (박스)</h3>
          <div className="ws-stepper">
            <button type="button" onClick={() => setQty((q) => Math.max((parseInt(q, 10) || 0) - 1, min))}>−</button>
            <input type="number" min={min} value={qty} onChange={(e) => setQty(e.target.value)} />
            <button type="button" onClick={() => setQty((q) => (parseInt(q, 10) || 0) + 1)}>+</button>
            <span className="ws-line">= {won(line)}원</span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>최소 {min}박스부터 담을 수 있어요. 배송지 분할(여러 주소)은 장바구니에서 설정해요.</p>
        </div>
      </div>

      <div className="ws-detail-bar">
        {added && <Link href="/wholesale/cart" className="btn btn-line" style={{ flex: '0 0 auto', padding: '0 16px', display: 'inline-flex', alignItems: 'center' }}>장바구니</Link>}
        <button className="authbtn" style={{ margin: 0, flex: 1 }} disabled={busy} onClick={() => add(false)}>{busy ? '담는 중…' : '장바구니 담기'}</button>
        <button className="authbtn ws-btn-dark" style={{ margin: 0, flex: 1 }} disabled={busy} onClick={() => add(true)}>바로 주문</button>
      </div>

      <Toaster />
    </div></div></div>
  );
}
