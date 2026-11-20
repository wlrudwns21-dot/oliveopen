'use client';
import { useState } from 'react';
import Link from 'next/link';
import { won } from '@/lib/format';
import { imageUrl } from '@/lib/supabase';
import Toaster, { toast } from './Toaster';
import AddressSearch from './AddressSearch';

const newShip = (qty) => ({ box_qty: qty || 0, recipient_name: '', recipient_phone: '', zipcode: '', address: '', detail_address: '', delivery_date: '', memo: '' });

export default function WholesaleCart({ items, account }) {
  const today = new Date().toISOString().slice(0, 10);
  const creditApproved = account?.credit_status === 'approved';

  const [cart, setCart] = useState(
    items.map((it) => ({
      product_pk: it.product.pk, sku: it.product.sku, name: it.product.name,
      box_label: it.product.box_label, price: it.product.wholesale_price || 0,
      min: it.product.min_order_box || 1, thumb: it.product.thumb, box_qty: it.box_qty,
    }))
  );
  const [step, setStep] = useState('cart');
  const [ship, setShip] = useState({});           // product_pk -> [shipment]
  const [manager, setManager] = useState(account?.manager_name || '');
  const [payment, setPayment] = useState('normal');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState(null);      // {pk, idx}
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const boxTotal = cart.reduce((a, c) => a + (parseInt(c.box_qty, 10) || 0), 0);
  const grand = cart.reduce((a, c) => a + c.price * (parseInt(c.box_qty, 10) || 0), 0);

  // ----- 장바구니 단계 -----
  async function setQty(pk, q) {
    const c = cart.find((x) => x.product_pk === pk);
    const qty = Math.max(parseInt(q, 10) || 0, c.min);
    setCart((a) => a.map((x) => x.product_pk === pk ? { ...x, box_qty: qty } : x));
    fetch('/api/wholesale/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_pk: pk, box_qty: qty, mode: 'set' }) }).catch(() => {});
  }
  async function remove(pk) {
    setCart((a) => a.filter((x) => x.product_pk !== pk));
    fetch('/api/wholesale/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_pk: pk }) }).catch(() => {});
  }

  function goOrder() {
    if (!cart.length) return;
    const next = {};
    for (const c of cart) {
      const cur = ship[c.product_pk];
      const sum = (cur || []).reduce((a, s) => a + (parseInt(s.box_qty, 10) || 0), 0);
      next[c.product_pk] = cur && sum === c.box_qty ? cur : [newShip(c.box_qty)];
    }
    setShip(next);
    setStep('order');
    window.scrollTo?.(0, 0);
  }

  // ----- 주문서 단계: 배송지 -----
  const shipSum = (pk) => (ship[pk] || []).reduce((a, s) => a + (parseInt(s.box_qty, 10) || 0), 0);
  const setShipField = (pk, idx, patch) => setShip((m) => ({ ...m, [pk]: m[pk].map((s, i) => i === idx ? { ...s, ...patch } : s) }));
  const addShip = (pk) => {
    const c = cart.find((x) => x.product_pk === pk);
    const remain = c.box_qty - shipSum(pk);
    setShip((m) => ({ ...m, [pk]: [...m[pk], newShip(Math.max(remain, 0))] }));
  };
  const removeShip = (pk, idx) => setShip((m) => ({ ...m, [pk]: m[pk].filter((_, i) => i !== idx) }));

  async function submit() {
    if (!manager.trim()) { toast('주문 담당자명을 입력해 주세요'); return; }
    for (const c of cart) {
      const sum = shipSum(c.product_pk);
      if (sum !== c.box_qty) { toast(`${c.name}: 배송지 박스 합(${sum})이 주문 박스(${c.box_qty})와 달라요`); return; }
      for (const s of ship[c.product_pk]) {
        if (!s.recipient_name?.trim() || !s.recipient_phone?.trim() || !s.address?.trim()) { toast(`${c.name}: 받는분·연락처·주소를 입력해 주세요`); return; }
      }
    }
    if (payment === 'tax_invoice' && !creditApproved) { toast('세금계산서는 여신 승인 후 이용할 수 있어요'); return; }
    setBusy(true);
    const lines = cart.map((c) => ({ product_pk: c.product_pk, shipments: ship[c.product_pk] }));
    const res = await fetch('/api/wholesale/order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, manager_name: manager, payment_method: payment, note }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone(j); else toast(j.error || '주문에 실패했어요');
  }

  // ----- 완료 -----
  if (done) {
    return <div className="stage"><div className="phone pg-app"><div className="view">
      <div style={{ textAlign: 'center', padding: '56px 28px' }}>
        <div style={{ fontSize: 54 }}>📦</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 8px' }}>도매 주문이 접수됐어요</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>
          주문번호 <b>{done.order_no}</b><br />
          총 <b style={{ color: 'var(--green-ink)' }}>{done.box_total}박스 · {won(done.total)}원</b><br />
          결제: <b>{done.payment_method === 'tax_invoice' ? '세금계산서(후불)' : '일반 결제'}</b><br />
          담당자 확인 후 배송·정산을 진행합니다.
        </p>
        <Link href="/wholesale" className="authbtn" style={{ display: 'flex', justifyContent: 'center', marginTop: 22, textDecoration: 'none' }}>도매관으로</Link>
        <Link href="/wholesale/orders" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--green2)' }}>주문 내역 보기 →</Link>
      </div>
    </div></div></div>;
  }

  // ----- 빈 장바구니 -----
  if (!cart.length) {
    return <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Link href="/wholesale" className="ws-back">←</Link><div className="ht"><h1 style={{ fontSize: 17 }}>도매 장바구니</h1><span className="vsub">WHOLESALE / B2B</span></div></div></header>
      <div style={{ textAlign: 'center', padding: '60px 28px', color: 'var(--muted)' }}>
        <div style={{ fontSize: 48 }}>🛒</div>
        <p style={{ marginTop: 12, fontSize: 13.5 }}>담긴 도매 상품이 없어요.</p>
        <Link href="/wholesale" className="authbtn" style={{ display: 'inline-flex', justifyContent: 'center', marginTop: 20, textDecoration: 'none', padding: '0 28px' }}>상품 담으러 가기</Link>
      </div>
    </div></div></div>;
  }

  return (
    <div className="stage"><div className="phone pg-app" style={{ paddingBottom: 80 }}><div className="view">
      <header className="viewhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="ws-back" onClick={() => step === 'order' ? setStep('cart') : (window.location.href = '/wholesale')}>←</button>
          <div className="ht"><h1 style={{ fontSize: 17 }}>{step === 'cart' ? '도매 장바구니' : '도매 주문서'}</h1><span className="vsub">{step === 'cart' ? `${cart.length}개 품목` : '배송지 · 결제'}</span></div>
        </div>
      </header>

      {step === 'cart' ? (
        <div style={{ padding: '14px 16px 24px' }}>
          {cart.map((c) => (
            <div key={c.product_pk} className="ws-cart-row">
              <div className="ws-cart-img">{c.thumb ? <img src={imageUrl(c.thumb)} alt="" /> : '📦'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b className="ws-cart-name">{c.name}</b>
                <span className="ws-cart-box">{c.box_label} · {won(c.price)}원/박스</span>
                <div className="ws-stepper ws-stepper-sm">
                  <button type="button" onClick={() => setQty(c.product_pk, (parseInt(c.box_qty, 10) || 0) - 1)}>−</button>
                  <input type="number" min={c.min} value={c.box_qty} onChange={(e) => setQty(c.product_pk, e.target.value)} />
                  <button type="button" onClick={() => setQty(c.product_pk, (parseInt(c.box_qty, 10) || 0) + 1)}>+</button>
                  <span className="ws-line">= {won(c.price * (parseInt(c.box_qty, 10) || 0))}원</span>
                </div>
              </div>
              <button className="ws-cart-del" onClick={() => remove(c.product_pk)}>✕</button>
            </div>
          ))}

          <div className="infocard ws-sum" style={{ marginTop: 14 }}>
            <div><span>총 박스</span><b>{boxTotal}박스</b></div>
            <div><span>합계 금액</span><b style={{ color: 'var(--green-ink)', fontSize: 19 }}>{won(grand)}원</b></div>
          </div>
          <button className="authbtn" onClick={goOrder}>주문서 작성하기 →</button>
          <Link href="/wholesale" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>+ 상품 더 담기</Link>
        </div>
      ) : (
        <div style={{ padding: '14px 16px 24px' }}>
          <div className="ws-note">상품마다 <b>박스를 여러 배송지로 나눠</b> 보낼 수 있어요. 예) 10박스 중 3박스는 A매장, 7박스는 B매장.</div>

          {cart.map((c) => {
            const remain = c.box_qty - shipSum(c.product_pk);
            return (
              <div key={c.product_pk} className="ws-order-line">
                <div className="ws-order-head">
                  <b>{c.name}</b>
                  <span>{c.box_label} · 총 {c.box_qty}박스</span>
                  <em className={remain === 0 ? 'ok' : 'warn'}>{remain === 0 ? '배분 완료' : `남은 ${remain}박스`}</em>
                </div>
                {(ship[c.product_pk] || []).map((s, idx) => (
                  <div key={idx} className="ws-ship">
                    <div className="ws-ship-top">
                      <span className="ws-ship-no">배송지 {idx + 1}</span>
                      <div className="ws-stepper ws-stepper-sm" style={{ margin: 0 }}>
                        <button type="button" onClick={() => setShipField(c.product_pk, idx, { box_qty: Math.max((parseInt(s.box_qty, 10) || 0) - 1, 0) })}>−</button>
                        <input type="number" min={0} value={s.box_qty} onChange={(e) => setShipField(c.product_pk, idx, { box_qty: e.target.value })} />
                        <button type="button" onClick={() => setShipField(c.product_pk, idx, { box_qty: (parseInt(s.box_qty, 10) || 0) + 1 })}>+</button>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)', marginLeft: 6 }}>박스</span>
                      </div>
                      {ship[c.product_pk].length > 1 && <button type="button" className="ws-ship-del" onClick={() => removeShip(c.product_pk, idx)}>삭제</button>}
                    </div>
                    <div className="ws-ship-grid">
                      <input placeholder="받는 분 *" value={s.recipient_name} onChange={(e) => setShipField(c.product_pk, idx, { recipient_name: e.target.value })} />
                      <input placeholder="연락처 *" value={s.recipient_phone} onChange={(e) => setShipField(c.product_pk, idx, { recipient_phone: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input value={s.zipcode} readOnly placeholder="우편번호" style={{ width: 92, flex: 'none', background: '#f6f8f5' }} />
                      <button type="button" className="btn btn-line btn-sm" style={{ flex: 'none' }} onClick={() => setSearch({ pk: c.product_pk, idx })}>주소 검색</button>
                      <input value={s.address} onChange={(e) => setShipField(c.product_pk, idx, { address: e.target.value })} placeholder="주소 *" style={{ flex: 1 }} />
                    </div>
                    <input value={s.detail_address} onChange={(e) => setShipField(c.product_pk, idx, { detail_address: e.target.value })} placeholder="상세주소" style={{ marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input type="date" min={today} value={s.delivery_date} onChange={(e) => setShipField(c.product_pk, idx, { delivery_date: e.target.value })} style={{ flex: 'none', width: 150 }} />
                      <input value={s.memo} onChange={(e) => setShipField(c.product_pk, idx, { memo: e.target.value })} placeholder="요청사항" style={{ flex: 1 }} />
                    </div>
                  </div>
                ))}
                <button type="button" className="ws-ship-add" onClick={() => addShip(c.product_pk)}>+ 배송지 추가 (다른 주소로 나눠 보내기)</button>
              </div>
            );
          })}

          <div className="infocard">
            <h3 className="ws-h">주문 담당자</h3>
            <div className="field" style={{ marginBottom: 0 }}><label>담당자명 *</label><input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="주문 담당자 이름" /></div>
          </div>

          <div className="infocard">
            <h3 className="ws-h">결제 수단</h3>
            <label className={`ws-pay ${payment === 'normal' ? 'on' : ''}`} onClick={() => setPayment('normal')}>
              <span className="ws-pay-radio" /><div><b>일반 결제</b><em>담당자 확인 후 결제 안내</em></div>
            </label>
            <label className={`ws-pay ${payment === 'tax_invoice' ? 'on' : ''} ${creditApproved ? '' : 'disabled'}`} onClick={() => creditApproved && setPayment('tax_invoice')}>
              <span className="ws-pay-radio" /><div><b>세금계산서 (후불)</b><em>{creditApproved ? '여신 승인 계정 · 월말 정산' : '여신 승인 후 이용 가능'}</em></div>
            </label>
            {!creditApproved && account?.credit_status !== 'pending' && (
              <Link href="/wholesale/credit" style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--green2)' }}>→ 세금계산서(여신) 신청하기</Link>
            )}
            {account?.credit_status === 'pending' && <p style={{ fontSize: 12, color: '#9a6a00', marginTop: 8 }}>⏳ 여신 승인 심사 중이에요.</p>}
          </div>

          <div className="infocard">
            <div className="field" style={{ marginBottom: 0 }}><label>주문 메모 (선택)</label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="결제조건, 요청사항 등" /></div>
          </div>

          <div className="infocard ws-sum">
            <div><span>총 박스</span><b>{boxTotal}박스</b></div>
            <div><span>합계 금액</span><b style={{ color: 'var(--green-ink)', fontSize: 19 }}>{won(grand)}원</b></div>
          </div>

          <button className="authbtn" disabled={busy} onClick={submit}>{busy ? '접수 중…' : `도매 주문하기 · ${won(grand)}원`}</button>
          <button type="button" className="btn btn-line" style={{ width: '100%', marginTop: 10 }} onClick={() => setStep('cart')}>← 장바구니 수정</button>
        </div>
      )}

      {search && <AddressSearch onClose={() => setSearch(null)} onSelect={({ zipcode, address }) => { setShipField(search.pk, search.idx, { zipcode, address }); setSearch(null); }} />}
      <Toaster />
    </div></div></div>
  );
}
