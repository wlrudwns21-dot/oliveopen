'use client';
import { useState } from 'react';
import { won } from '@/lib/format';
import Toaster, { toast } from './Toaster';
import AddressSearch from './AddressSearch';
import { IcChev } from './icons';

let _id = 0;
const newItem = (pk) => ({ id: ++_id, product_pk: pk || '', box_qty: 1, recipient_name: '', recipient_phone: '', zipcode: '', address: '', detail_address: '', delivery_date: '', memo: '' });

export default function WholesaleOrder({ products, company }) {
  const [items, setItems] = useState([newItem(products[0]?.pk || '')]);
  const [openId, setOpenId] = useState(items[0]?.id);
  const [searchId, setSearchId] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const prodOf = (pk) => products.find((p) => String(p.pk) === String(pk));
  const setItem = (id, patch) => setItems((a) => a.map((it) => it.id === id ? { ...it, ...patch } : it));
  const addItem = () => { const it = newItem(products[0]?.pk || ''); setItems((a) => [...a, it]); setOpenId(it.id); };
  const removeItem = (id) => setItems((a) => a.filter((it) => it.id !== id));

  const lineOf = (it) => (prodOf(it.product_pk)?.wholesale_price || 0) * (parseInt(it.box_qty, 10) || 0);
  const boxTotal = items.reduce((a, it) => a + (parseInt(it.box_qty, 10) || 0), 0);
  const grand = items.reduce((a, it) => a + lineOf(it), 0);

  async function submit(e) {
    e.preventDefault();
    for (const it of items) {
      const p = prodOf(it.product_pk);
      if (!p) { toast('상품을 선택해 주세요'); setOpenId(it.id); return; }
      if ((parseInt(it.box_qty, 10) || 0) < (p.min_order_box || 1)) { toast(`${p.name}: 최소 ${p.min_order_box || 1}박스`); setOpenId(it.id); return; }
      if (!it.recipient_name || !it.recipient_phone || !it.address) { toast('받는분·연락처·주소를 입력해 주세요'); setOpenId(it.id); return; }
    }
    setBusy(true);
    const res = await fetch('/api/wholesale/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, note }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone(j); else toast(j.error || '주문에 실패했어요');
  }

  if (!products.length) {
    return <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead"><div className="ht"><h1>도매 전용관</h1><span className="vsub">WHOLESALE</span></div></header>
      <div style={{ textAlign: 'center', padding: '56px 28px', color: 'var(--muted)' }}><div style={{ fontSize: 48 }}>📦</div><p style={{ marginTop: 12, fontSize: 13.5 }}>등록된 도매 상품이 아직 없어요.<br />관리자에서 상품을 도매 전용으로 설정해 주세요.</p></div>
    </div></div></div>;
  }

  if (done) {
    return <div className="stage"><div className="phone pg-app"><div className="view">
      <div style={{ textAlign: 'center', padding: '56px 28px' }}>
        <div style={{ fontSize: 54 }}>📦</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 8px' }}>도매 주문이 접수됐어요</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>주문번호 <b>{done.order_no}</b><br />총 <b style={{ color: 'var(--green-ink)' }}>{done.box_total}박스 · {won(done.total)}원</b><br />담당자 확인 후 배송을 진행합니다.</p>
        <a href="/wholesale" className="authbtn" style={{ display: 'flex', justifyContent: 'center', marginTop: 22, textDecoration: 'none' }}>새 주문</a>
      </div>
    </div></div></div>;
  }

  return (
    <div className="stage"><div className="phone pg-app" style={{ paddingBottom: 0 }}><div className="view" style={{ paddingBottom: 20 }}>
      <header className="viewhead"><div className="ht"><h1>도매 전용 주문</h1><span className="vsub">{company}</span></div></header>

      <form onSubmit={submit} style={{ padding: '14px 16px 24px' }}>
        <div className="ws-note">상품을 <b>박스 단위</b>로 담고, 박스마다 <b>받는 곳(배송지)</b>을 따로 지정할 수 있어요. 여러 곳으로 나눠 보내려면 아래 <b>+ 품목 추가</b>를 눌러 주세요.</div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--green-ink)', margin: '4px 2px 8px' }}>주문 품목 ({items.length})</label>
        {items.map((it, idx) => {
          const p = prodOf(it.product_pk);
          const open = openId === it.id;
          return (
            <div key={it.id} className="gift-item">
              <button type="button" className="gi-head" onClick={() => setOpenId(open ? null : it.id)}>
                <span className="gi-no">{idx + 1}</span>
                <span className="gi-sum">
                  <b>{p ? p.name : '상품 선택'}{p?.box_label ? ` · ${p.box_label}` : ''}</b>
                  <em>{it.box_qty || 0}박스{it.recipient_name ? ` · ${it.recipient_name}님` : ' · 받는분 미입력'}</em>
                </span>
                <span className="gi-price">{lineOf(it) ? `${won(lineOf(it))}원` : ''}</span>
                <span className={`gi-chev ${open ? 'on' : ''}`}><IcChev w={2.4} /></span>
              </button>
              {open && (
                <div className="gi-body">
                  <div className="field">
                    <label>상품 *</label>
                    <select value={it.product_pk} onChange={(e) => setItem(it.id, { product_pk: e.target.value })}>
                      <option value="">상품 선택</option>
                      {products.map((pp) => <option key={pp.pk} value={pp.pk}>{pp.name}{pp.box_label ? ` (${pp.box_label})` : ''} · {won(pp.wholesale_price)}원/박스</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>박스 수량 *{p?.min_order_box > 1 ? ` (최소 ${p.min_order_box}박스)` : ''}</label>
                    <div className="ws-stepper">
                      <button type="button" onClick={() => setItem(it.id, { box_qty: Math.max((parseInt(it.box_qty, 10) || 0) - 1, 0) })}>−</button>
                      <input type="number" min={0} value={it.box_qty} onChange={(e) => setItem(it.id, { box_qty: e.target.value })} />
                      <button type="button" onClick={() => setItem(it.id, { box_qty: (parseInt(it.box_qty, 10) || 0) + 1 })}>+</button>
                      <span className="ws-line">= {won(lineOf(it))}원</span>
                    </div>
                  </div>
                  <div className="field"><label>받는 분 *</label><input value={it.recipient_name} onChange={(e) => setItem(it.id, { recipient_name: e.target.value })} /></div>
                  <div className="field"><label>연락처 *</label><input value={it.recipient_phone} onChange={(e) => setItem(it.id, { recipient_phone: e.target.value })} placeholder="010-0000-0000" /></div>
                  <div className="field">
                    <label>배송지 *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={it.zipcode} readOnly placeholder="우편번호" style={{ width: 96, flex: 'none', background: '#f6f8f5' }} />
                      <button type="button" className="btn btn-line btn-sm" style={{ flex: 'none' }} onClick={() => setSearchId(it.id)}>주소 검색</button>
                    </div>
                    <input value={it.address} onChange={(e) => setItem(it.id, { address: e.target.value })} placeholder="주소 검색으로 입력" style={{ marginTop: 8 }} />
                  </div>
                  <div className="field"><label>상세주소</label><input value={it.detail_address} onChange={(e) => setItem(it.id, { detail_address: e.target.value })} /></div>
                  <div className="field"><label>배송 희망일</label><input type="date" min={today} value={it.delivery_date} onChange={(e) => setItem(it.id, { delivery_date: e.target.value })} /></div>
                  <div className="field"><label>요청사항</label><input value={it.memo} onChange={(e) => setItem(it.id, { memo: e.target.value })} placeholder="예: 오전 배송 희망" /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {items.length > 1 ? <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => removeItem(it.id)}>품목 삭제</button> : <span />}
                    <button type="button" className="btn btn-line btn-sm" onClick={() => setOpenId(null)}>접기</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button type="button" className="gift-add" onClick={addItem}>+ 품목 추가 (다른 배송지)</button>

        <div className="infocard" style={{ marginTop: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}><label>주문 메모 (선택)</label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="세금계산서, 결제조건 등 요청사항" /></div>
        </div>

        <div className="infocard ws-sum">
          <div><span>총 박스</span><b>{boxTotal}박스</b></div>
          <div><span>합계 금액</span><b style={{ color: 'var(--green-ink)', fontSize: 19 }}>{won(grand)}원</b></div>
        </div>

        <button className="authbtn" disabled={busy}>{busy ? '접수 중…' : '도매 주문 신청'}</button>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>주문 접수 후 담당자가 확인하여 세금계산서·결제 안내를 드립니다.</p>
      </form>

      {searchId != null && <AddressSearch onClose={() => setSearchId(null)} onSelect={({ zipcode, address }) => { setItem(searchId, { zipcode, address }); setSearchId(null); }} />}
      <Toaster />
    </div></div></div>
  );
}
