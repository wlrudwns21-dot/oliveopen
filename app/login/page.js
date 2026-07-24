'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pw }),
    });
    if (res.ok) { router.push(next); router.refresh(); }
    else setErr('아이디 또는 비밀번호가 올바르지 않아요');
  }

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <div style={{ padding: '14px 16px 0' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--green2)' }}>← 홈으로</Link>
          </div>
          <div className="authwrap">
            <div className="logo">
              <img src="/assets/logo-emblem.png" alt="" />
              <b>Olive Open</b>
              <p>FRESH MARKET</p>
            </div>
            <form onSubmit={submit}>
              <div className="field"><label>아이디</label><input value={id} onChange={(e) => setId(e.target.value)} required /></div>
              <div className="field"><label>비밀번호</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
              {err && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
              <button className="authbtn">로그인</button>
            </form>
            <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, color: 'var(--muted)' }}>
              아직 회원이 아니세요? <Link href="/signup" style={{ color: 'var(--green2)', fontWeight: 700 }}>회원가입</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
