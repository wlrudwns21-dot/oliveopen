'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from './Toaster';
import { IcDoc, IcPin, IcHeart, IcCoupon, IcChat, IcOut, IcChev } from './icons';

const Lead = ({ children }) => <span className="lead">{children}</span>;
const Chev = () => <span className="chev"><IcChev w={2.2} /></span>;

export function MyMenu({ wishCount, couponCount }) {
  const router = useRouter();
  return (
    <div className="menu">
      <button onClick={() => document.getElementById('olist')?.scrollIntoView({ behavior: 'smooth' })}>
        <Lead><IcDoc /></Lead>주문 내역<Chev />
      </button>
      <button onClick={() => toast('배송지는 주문/결제 화면에서 수정할 수 있어요')}>
        <Lead><IcPin /></Lead>배송지 관리<Chev />
      </button>
      <button onClick={() => toast(`찜한 상품 ${wishCount}개`)}>
        <Lead><IcHeart w={1.7} /></Lead>찜한 상품<Chev />
      </button>
      <button onClick={() => toast(`사용 가능한 쿠폰 ${couponCount}장`)}>
        <Lead><IcCoupon /></Lead>쿠폰함<Chev />
      </button>
      <button onClick={() => toast('1:1 문의 연결 중이에요')}>
        <Lead><IcChat /></Lead>1:1 문의<Chev />
      </button>
      <button
        style={{ color: 'var(--danger)' }}
        onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); router.refresh(); }}
      >
        <Lead><IcOut /></Lead>로그아웃
      </button>
    </div>
  );
}

export function ReturnButton({ orderPk }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function submit() {
    const reason = window.prompt('반품 사유를 입력해 주세요');
    if (reason == null) return;
    setBusy(true);
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_pk: orderPk, reason }),
    });
    setBusy(false);
    if (res.ok) { toast('반품이 접수됐어요'); router.refresh(); }
    else toast('접수에 실패했어요');
  }
  return <button className="oret" disabled={busy} onClick={submit}>반품 접수</button>;
}
