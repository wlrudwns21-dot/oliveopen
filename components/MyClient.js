'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from './Toaster';
import { IcDoc, IcPin, IcHeart, IcCoupon, IcChat, IcOut, IcChev } from './icons';

const Lead = ({ children }) => <span className="lead">{children}</span>;
const Chev = () => <span className="chev"><IcChev w={2.2} /></span>;

export function MyMenu({ wishCount = 0, couponCount = 0 }) {
  const router = useRouter();
  return (
    <div className="menu">
      <Link href="/my/orders"><Lead><IcDoc /></Lead>주문 내역<Chev /></Link>
      <Link href="/my/addresses"><Lead><IcPin /></Lead>배송지 관리<Chev /></Link>
      <Link href="/my/wishlist"><Lead><IcHeart w={1.7} /></Lead>찜한 상품 {wishCount > 0 && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>({wishCount})</span>}<Chev /></Link>
      <Link href="/my/coupons"><Lead><IcCoupon /></Lead>쿠폰함 {couponCount > 0 && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>({couponCount})</span>}<Chev /></Link>
      <Link href="/my/inquiry"><Lead><IcChat /></Lead>1:1 문의<Chev /></Link>
      <button
        style={{ color: 'var(--danger)' }}
        onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); router.refresh(); }}
      >
        <Lead><IcOut /></Lead>로그아웃
      </button>
    </div>
  );
}

// 반품 빠른 사유
const RETURN_REASONS = ['단순 변심', '상품 불량·파손', '신선도 불만족', '오배송(다른 상품)', '배송 지연', '상품 설명과 다름'];

export function ReturnButton({ orderPk }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [picked, setPicked] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const reason = text.trim() || picked;

  async function submit() {
    if (!reason) { toast('반품 사유를 선택하거나 입력해 주세요'); return; }
    setBusy(true);
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_pk: orderPk, reason }),
    });
    setBusy(false);
    if (res.ok) { setOpen(false); toast('반품이 접수됐어요'); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); toast(j.error || '접수에 실패했어요'); }
  }

  return (
    <>
      <button className="oret" onClick={() => { setOpen(true); setPicked(''); setText(''); }}>반품 접수</button>
      {open && mounted && createPortal(
        <>
          <div className="rt-scrim" onClick={() => setOpen(false)} />
          <div className="rt-sheet">
            <h3>반품 접수</h3>
            <div className="rt-sub">반품 사유를 선택하거나 직접 입력해 주세요.</div>
            <div className="rt-chips">
              {RETURN_REASONS.map((r) => (
                <button key={r} className={`rt-chip ${picked === r && !text ? 'on' : ''}`} onClick={() => { setPicked(r); setText(''); }}>{r}</button>
              ))}
            </div>
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="직접 입력 (선택) — 자세히 적어주시면 처리가 빨라요" />
            <div className="rt-acts">
              <button className="cancel" onClick={() => setOpen(false)}>취소</button>
              <button className="ok" disabled={busy || !reason} onClick={submit}>{busy ? '접수 중…' : '반품 접수하기'}</button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
