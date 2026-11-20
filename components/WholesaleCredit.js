'use client';
import { useState } from 'react';
import Link from 'next/link';
import { won } from '@/lib/format';
import Toaster, { toast } from './Toaster';

export default function WholesaleCredit({ status = 'none', limit = 0, company }) {
  const [st, setSt] = useState(status);
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    const res = await fetch('/api/wholesale/credit', { method: 'POST' });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setSt('pending'); toast('여신(세금계산서) 신청이 접수됐어요'); }
    else toast(j.error || '신청에 실패했어요');
  }

  const box = {
    none: { ic: '🧾', tt: '세금계산서(후불) 결제 신청', ds: '세금계산서 결제는 외상(후불) 거래라 별도 여신 심사가 필요해요. 신청하시면 담당자가 사업자 정보를 확인하고 한도를 설정해 승인해 드려요.' },
    pending: { ic: '⏳', tt: '여신 승인 심사 중', ds: '제출하신 정보를 담당자가 검토하고 있어요. 승인되면 주문 시 세금계산서(후불) 결제를 선택할 수 있어요.' },
    approved: { ic: '✅', tt: '세금계산서(후불) 이용 가능', ds: `여신이 승인된 계정이에요.${limit > 0 ? ` 여신 한도 ${won(limit)}원.` : ''} 주문 시 '세금계산서(후불)'을 선택해 월말 정산으로 결제하실 수 있어요.` },
    rejected: { ic: '❌', tt: '여신 신청이 반려됐어요', ds: '서류/신용 확인에서 승인되지 않았어요. 자세한 내용은 담당자에게 문의해 주세요. 다시 신청할 수 있어요.' },
  }[st] || {};

  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/wholesale" className="ws-back">←</Link>
          <div className="ht"><h1 style={{ fontSize: 17 }}>세금계산서 · 여신</h1><span className="vsub">{company || 'WHOLESALE / B2B'}</span></div>
        </div>
      </header>

      <div style={{ textAlign: 'center', padding: '44px 28px' }}>
        <div style={{ fontSize: 52 }}>{box.ic}</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 10px' }}>{box.tt}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.75 }}>{box.ds}</p>

        {(st === 'none' || st === 'rejected') && (
          <button className="authbtn" style={{ marginTop: 24 }} disabled={busy} onClick={apply}>{busy ? '신청 중…' : '여신(세금계산서) 신청하기'}</button>
        )}
        {st === 'approved' && (
          <Link href="/wholesale/cart" className="authbtn" style={{ display: 'inline-flex', justifyContent: 'center', marginTop: 24, textDecoration: 'none', padding: '0 24px' }}>주문하러 가기</Link>
        )}
      </div>

      <Toaster />
    </div></div></div>
  );
}
