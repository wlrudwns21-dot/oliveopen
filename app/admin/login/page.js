'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e?.preventDefault();
    setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pw }),
    });
    const j = await res.json();
    if (res.ok) router.replace('/admin');
    else setErr(j.error || '로그인에 실패했어요');
  }

  return (
    <div className="adm-login">
      <div className="box">
        <div className="lc-emb"><img src="/assets/logo-emblem.png" alt="" /></div>
        <div className="lc-brand">Olive Open</div>
        <div className="lc-sub">ADMIN CONSOLE</div>
        <form onSubmit={submit}>
          <div className="lc-fields">
            <label>아이디</label>
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" autoComplete="username" />
            <label>비밀번호</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoComplete="current-password" />
          </div>
          <button className="lc-btn">로그인</button>
        </form>
        <div className="lc-err">{err}</div>
        <div className="lc-hint" style={{ borderTop: '1px solid #E4EBE3', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>계정이 필요하신가요?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <a href="/admin/apply" className="btn btn-line btn-sm" style={{ textDecoration: 'none' }}>어드민 신청</a>
            <a href="/partner/apply" className="btn btn-line btn-sm" style={{ textDecoration: 'none' }}>파트너 신청</a>
          </div>
        </div>
      </div>
    </div>
  );
}
