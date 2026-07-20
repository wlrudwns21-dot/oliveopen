'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO = [
  { id: 'admin', pw: 'admin1234', label: '마스터', desc: '전체 권한' },
  { id: 'manager', pw: 'manager1234', label: '관리자', desc: '회원관리 제외' },
  { id: 'operator', pw: 'operator1234', label: '운영자', desc: '회원·쿠폰 제외' },
];

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
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="admin / manager / operator" autoComplete="username" />
            <label>비밀번호</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoComplete="current-password" />
          </div>
          <button className="lc-btn">로그인</button>
        </form>
        <div className="lc-err">{err}</div>
        <div className="lc-hint">
          <b>데모 계정 · 클릭하면 자동 입력</b>
          {DEMO.map((d) => (
            <button key={d.id} onClick={() => { setId(d.id); setPw(d.pw); }}>
              <span>{d.label}</span> {d.desc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
