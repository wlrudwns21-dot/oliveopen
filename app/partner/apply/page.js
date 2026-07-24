'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PartnerApplyPage() {
  const [form, setForm] = useState({ id: '', password: '', company: '', contact: '' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/partner/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setDone(true);
    else setErr(j.error || '신청에 실패했어요');
  }

  return (
    <div className="adm-login">
      <div className="box">
        <div className="lc-emb"><img src="/assets/logo-emblem.png" alt="" /></div>
        <div className="lc-brand">Olive Open</div>
        <div className="lc-sub">PARTNER 신청</div>

        {done ? (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 44 }}>🤝</div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: '10px 0 6px' }}>신청이 접수됐어요</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>마스터 승인 후 로그인하실 수 있어요.<br />승인 시 추천인 코드가 배정됩니다.</p>
            <Link href="/admin/login" className="lc-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 18, textDecoration: 'none' }}>로그인 화면으로</Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 4px' }}>파트너(추천인)로 신청하면, 승인 후 내 추천 코드의 매출·고객을 조회할 수 있어요.</p>
            <form onSubmit={submit}>
              <div className="lc-fields">
                <label>파트너명 / 업체</label>
                <input value={form.company} onChange={set('company')} placeholder="예: 올리브파트너스" />
                <label>연락처</label>
                <input value={form.contact} onChange={set('contact')} placeholder="010-0000-0000" />
                <label>아이디</label>
                <input value={form.id} onChange={set('id')} autoComplete="username" />
                <label>비밀번호 (8자 이상)</label>
                <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
              </div>
              <button className="lc-btn">파트너 신청</button>
            </form>
            {err && <div className="lc-err">{err}</div>}
            <p style={{ fontSize: 12, marginTop: 14 }}>
              <Link href="/admin/login" style={{ color: 'var(--green2)', fontWeight: 700 }}>← 로그인으로</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
