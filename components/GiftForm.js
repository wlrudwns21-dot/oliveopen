'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { won } from '@/lib/format';
import Toaster, { toast } from './Toaster';
import AddressSearch from './AddressSearch';
import { IcBack } from './icons';

export default function GiftForm({ products }) {
  const router = useRouter();
  const [form, setForm] = useState({
    product_pk: products[0]?.pk || '', orderer_name: '', orderer_phone: '',
    recipient_name: '', recipient_phone: '', zipcode: '', address: '', detail_address: '',
    delivery_date: '', memo: '',
  });
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const sel = products.find((p) => String(p.pk) === String(form.product_pk));
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e) {
    e.preventDefault();
    if (!form.recipient_name || !form.recipient_phone || !form.address) { toast('받는분 정보와 주소를 입력해 주세요'); return; }
    setBusy(true);
    const res = await fetch('/api/gift/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone(true);
    else toast(j.error || '신청에 실패했어요');
  }

  if (done) {
    return (
      <div className="stage"><div className="phone pg-app"><div className="view">
        <div className="authwrap" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>🎁</div>
          <h2 style={{ fontSize: 20, margin: '10px 0 6px' }}>선물 신청이 접수됐어요</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {sel?.name} · {won(sel?.price)}원<br />받는 분 {form.recipient_name}님께<br />
            {form.delivery_date ? `${form.delivery_date} 배송 예정` : '희망일 협의 후 배송'}
          </p>
          <button className="authbtn" style={{ marginTop: 20 }} onClick={() => router.push('/')}>홈으로</button>
        </div>
      </div></div></div>
    );
  }

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <Link href="/event/chuseok" className="iconbtn" aria-label="뒤로" style={{ marginLeft: -6 }}><IcBack /></Link>
            <div className="ht"><h1>추석 선물 신청</h1><span className="vsub">CHUSEOK GIFT</span></div>
          </header>

          <form onSubmit={submit} style={{ padding: '14px 16px 24px' }}>
            {/* 상품 선택 */}
            <div className="infocard">
              <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 10 }}>1. 선물 상품</h3>
              <div className="field">
                <label>상품 선택 *</label>
                <select value={form.product_pk} onChange={set('product_pk')}>
                  {products.map((p) => <option key={p.pk} value={p.pk}>{p.name} · {won(p.price)}원</option>)}
                </select>
              </div>
              {sel && <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-ink)' }}>선택: {sel.name} · {won(sel.price)}원</div>}
            </div>

            {/* 신청자 */}
            <div className="infocard">
              <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 10 }}>2. 신청자(주문자)</h3>
              <div className="field"><label>이름</label><input value={form.orderer_name} onChange={set('orderer_name')} placeholder="신청자 이름" /></div>
              <div className="field"><label>연락처</label><input value={form.orderer_phone} onChange={set('orderer_phone')} placeholder="010-0000-0000" /></div>
            </div>

            {/* 받는 분 */}
            <div className="infocard">
              <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 10 }}>3. 받는 분 · 배송지</h3>
              <div className="field"><label>받는 분 이름 *</label><input value={form.recipient_name} onChange={set('recipient_name')} /></div>
              <div className="field"><label>받는 분 연락처 *</label><input value={form.recipient_phone} onChange={set('recipient_phone')} placeholder="010-0000-0000" /></div>
              <div className="field">
                <label>주소 *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.zipcode} readOnly placeholder="우편번호" style={{ width: 96, flex: 'none', background: '#f6f8f5' }} />
                  <button type="button" className="btn btn-line btn-sm" style={{ flex: 'none' }} onClick={() => setSearching(true)}>주소 검색</button>
                </div>
                <input value={form.address} onChange={set('address')} placeholder="주소 검색으로 입력" style={{ marginTop: 8 }} />
              </div>
              <div className="field"><label>상세주소</label><input value={form.detail_address} onChange={set('detail_address')} placeholder="동/호수 등" /></div>
            </div>

            {/* 배송 희망일 */}
            <div className="infocard">
              <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 10 }}>4. 배송 희망일</h3>
              <div className="field"><label>희망 배송일</label><input type="date" min={today} value={form.delivery_date} onChange={set('delivery_date')} /></div>
              <div className="field"><label>요청사항 (선택)</label><textarea rows={2} value={form.memo} onChange={set('memo')} placeholder="예: 명절 전날까지 도착 희망" /></div>
            </div>

            <button className="authbtn" disabled={busy}>{busy ? '접수 중…' : '선물 신청하기'}</button>
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>접수 후 담당자가 확인하여 배송을 진행합니다.</p>
          </form>
        </div>

        {searching && (
          <AddressSearch
            onClose={() => setSearching(false)}
            onSelect={({ zipcode, address }) => { setForm((f) => ({ ...f, zipcode, address })); setSearching(false); toast('주소를 입력했어요'); }}
          />
        )}
        <Toaster />
      </div>
    </div>
  );
}
