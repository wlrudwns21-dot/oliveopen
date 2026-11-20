'use client';
import { useState } from 'react';
import Link from 'next/link';
import Toaster, { toast } from './Toaster';

/** 도매 전용 로그인 입구 — 일반 고객 로그인과 분리된 B2B 전용 화면 */
export default function WholesaleGate() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!id || !pw) { toast('아이디와 비밀번호를 입력해 주세요'); return; }
    setBusy(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pw }),
    });
    setBusy(false);
    if (res.ok) { window.location.href = '/wholesale'; }
    else { toast('아이디 또는 비밀번호를 확인해 주세요'); }
  }

  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead"><div className="ht"><h1>도매 회원 로그인</h1><span className="vsub">WHOLESALE / B2B</span></div></header>

      <div style={{ padding: '12px 16px 28px' }}>
        <div className="ws-note">도매 사업자 <b>전용</b> 입구예요. 승인된 도매 회원만 <b>박스 단위·복수 배송지</b> 주문을 이용하실 수 있어요.</div>

        <form onSubmit={submit} className="infocard">
          <h3 className="ws-h">도매 계정 로그인</h3>
          <div className="field"><label>아이디</label><input value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" placeholder="도매 계정 아이디" /></div>
          <div className="field"><label>비밀번호</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></div>
          <button className="authbtn" disabled={busy} style={{ marginTop: 4 }}>{busy ? '로그인 중…' : '도매 회원 로그인'}</button>
        </form>

        <div className="ws-cert-empty" style={{ marginTop: 16, textAlign: 'center' }}>
          아직 도매 회원이 아니신가요?<br />
          <Link href="/wholesale/apply" style={{ display: 'inline-block', marginTop: 8, fontWeight: 800, color: 'var(--green2)', textDecoration: 'none' }}>사업자등록증으로 도매 신청하기 →</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link href="/" style={{ fontSize: 12.5, color: 'var(--muted)' }}>← 일반 쇼핑몰로 돌아가기</Link>
        </div>
      </div>

      <Toaster />
    </div></div></div>
  );
}
