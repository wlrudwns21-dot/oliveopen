'use client';
import { useState } from 'react';
import { won } from '@/lib/format';
import Toaster, { toast } from './Toaster';
import AddressSearch from './AddressSearch';
import { IcChev } from './icons';

let _id = 0;
const newItem = (product_pk) => ({
  id: ++_id, product_pk: product_pk || '', recipient_name: '', recipient_phone: '',
  zipcode: '', address: '', detail_address: '', delivery_date: '', memo: '',
});

export default function GiftForm({ products, event }) {
  const [orderer, setOrderer] = useState({ name: '', phone: '' });
  const [items, setItems] = useState([newItem(products[0]?.pk || '')]);
  const [openId, setOpenId] = useState(items[0]?.id);
  const [searchId, setSearchId] = useState(null); // 주소 검색 대상 item id
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const prodOf = (pk) => products.find((p) => String(p.pk) === String(pk));
  const setItem = (id, patch) => setItems((arr) => arr.map((it) => it.id === id ? { ...it, ...patch } : it));
  const addItem = () => { const it = newItem(products[0]?.pk || ''); setItems((a) => [...a, it]); setOpenId(it.id); };
  const removeItem = (id) => setItems((a) => a.filter((it) => it.id !== id));

  const total = items.reduce((a, it) => a + (prodOf(it.product_pk)?.price || 0), 0);

  async function submit(e) {
    e.preventDefault();
    for (const it of items) {
      if (!it.product_pk) { toast('상품을 선택해 주세요'); setOpenId(it.id); return; }
      if (!it.recipient_name || !it.recipient_phone || !it.address) { toast('받는분 이름·연락처·주소를 입력해 주세요'); setOpenId(it.id); return; }
    }
    setBusy(true);
    const res = await fetch('/api/gift/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderer_name: orderer.name, orderer_phone: orderer.phone, items }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone({ count: j.count });
    else toast(j.error || '신청에 실패했어요');
  }

  function resetAll() {
    setOrderer({ name: '', phone: '' });
    const it = newItem(products[0]?.pk || '');
    setItems([it]); setOpenId(it.id); setDone(null);
  }

  const Banner = () => event ? (
    <div className={`event-hero ${event.theme || 'green'}`} style={{ height: 190 }}>
      {event.hero_image && <img src={event.hero_image} alt="" />}
      <span className="ov" />
      <span className="txt">
        {event.badge && <span className="ev-badge">{event.badge}</span>}
        <h2>{event.title}</h2>
        {event.subtitle && <p>{event.subtitle}</p>}
      </span>
    </div>
  ) : null;

  if (done) {
    return (
      <div className="stage"><div className="phone pg-app" style={{ paddingBottom: 0 }}><div className="view" style={{ paddingBottom: 20 }}>
        <Banner />
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 56 }}>🎁</div>
          <h2 style={{ fontSize: 20, margin: '10px 0 6px' }}>선물 신청이 접수됐어요</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>총 <b style={{ color: 'var(--green-ink)' }}>{done.count}건</b>의 선물이 접수됐어요.<br />담당자가 확인 후 배송을 진행합니다.</p>
          <a href="https://www.oliveopen.com/web/cart" className="authbtn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20, textDecoration: 'none' }}>돌아가기</a>
          <button type="button" onClick={resetAll} style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--green2)' }}>새로 신청하기</button>
        </div>
      </div></div></div>
    );
  }

  return (
    <div className="stage">
      <div className="phone pg-app" style={{ paddingBottom: 0 }}>
        <div className="view" style={{ paddingBottom: 20 }}>
          <Banner />

          <form onSubmit={submit} style={{ padding: '14px 16px 24px' }}>
            {/* 신청자 */}
            <div className="infocard">
              <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 10 }}>신청자(주문자)</h3>
              <div className="field"><label>이름</label><input value={orderer.name} onChange={(e) => setOrderer({ ...orderer, name: e.target.value })} placeholder="신청자 이름" /></div>
              <div className="field"><label>연락처</label><input value={orderer.phone} onChange={(e) => setOrderer({ ...orderer, phone: e.target.value })} placeholder="010-0000-0000" /></div>
            </div>

            {/* 선물 항목 (아코디언) */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--green-ink)', margin: '6px 2px 8px' }}>선물 상품 ({items.length})</label>
            {items.map((it, idx) => {
              const p = prodOf(it.product_pk);
              const open = openId === it.id;
              const filled = it.recipient_name && it.recipient_phone && it.address;
              return (
                <div key={it.id} className="gift-item">
                  <button type="button" className="gi-head" onClick={() => setOpenId(open ? null : it.id)}>
                    <span className="gi-no">{idx + 1}</span>
                    <span className="gi-sum">
                      <b>{p ? p.name : '상품 선택'}</b>
                      <em>{it.recipient_name ? `${it.recipient_name}님${it.delivery_date ? ` · ${it.delivery_date}` : ''}` : (filled ? '' : '받는분 미입력')}</em>
                    </span>
                    <span className="gi-price">{p ? `${won(p.price)}원` : ''}</span>
                    <span className={`gi-chev ${open ? 'on' : ''}`}><IcChev w={2.4} /></span>
                  </button>
                  {open && (
                    <div className="gi-body">
                      <div className="field">
                        <label>상품 선택 *</label>
                        <select value={it.product_pk} onChange={(e) => setItem(it.id, { product_pk: e.target.value })}>
                          <option value="">상품을 선택하세요</option>
                          {products.map((pp) => <option key={pp.pk} value={pp.pk}>{pp.name} · {won(pp.price)}원</option>)}
                        </select>
                      </div>
                      <div className="field"><label>받는 분 이름 *</label><input value={it.recipient_name} onChange={(e) => setItem(it.id, { recipient_name: e.target.value })} /></div>
                      <div className="field"><label>받는 분 연락처 *</label><input value={it.recipient_phone} onChange={(e) => setItem(it.id, { recipient_phone: e.target.value })} placeholder="010-0000-0000" /></div>
                      <div className="field">
                        <label>주소 *</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={it.zipcode} readOnly placeholder="우편번호" style={{ width: 96, flex: 'none', background: '#f6f8f5' }} />
                          <button type="button" className="btn btn-line btn-sm" style={{ flex: 'none' }} onClick={() => setSearchId(it.id)}>주소 검색</button>
                        </div>
                        <input value={it.address} onChange={(e) => setItem(it.id, { address: e.target.value })} placeholder="주소 검색으로 입력" style={{ marginTop: 8 }} />
                      </div>
                      <div className="field"><label>상세주소</label><input value={it.detail_address} onChange={(e) => setItem(it.id, { detail_address: e.target.value })} placeholder="동/호수 등" /></div>
                      <div className="field"><label>배송 희망일</label><input type="date" min={today} value={it.delivery_date} onChange={(e) => setItem(it.id, { delivery_date: e.target.value })} /></div>
                      <div className="field"><label>요청사항 (선택)</label><input value={it.memo} onChange={(e) => setItem(it.id, { memo: e.target.value })} placeholder="예: 명절 전날까지 도착 희망" /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        {items.length > 1
                          ? <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => removeItem(it.id)}>이 상품 삭제</button>
                          : <span />}
                        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpenId(null)}>접기</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button type="button" className="gift-add" onClick={addItem}>+ 상품 추가</button>

            <div className="infocard" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>선물 {items.length}건 합계</span>
              <b style={{ fontSize: 18, color: 'var(--green-ink)' }}>{won(total)}원</b>
            </div>

            <button className="authbtn" disabled={busy}>{busy ? '접수 중…' : `선물 ${items.length}건 신청하기`}</button>
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>접수 후 담당자가 확인하여 배송을 진행합니다.</p>
          </form>
        </div>

        {searchId != null && (
          <AddressSearch
            onClose={() => setSearchId(null)}
            onSelect={({ zipcode, address }) => { setItem(searchId, { zipcode, address }); setSearchId(null); toast('주소를 입력했어요'); }}
          />
        )}
        <Toaster />
      </div>
    </div>
  );
}
