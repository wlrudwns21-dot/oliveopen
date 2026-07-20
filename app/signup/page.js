'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ id: '', password: '', nick: '', phone: '', address: '', detail_address: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push('/'); router.refresh(); }
    else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || '가입에 실패했어요');
    }
  }

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <div className="authwrap" style={{ justifyContent: 'flex-start', paddingTop: 46 }}>
            <div className="logo">
              <img src="/assets/logo-emblem.png" alt="" />
              <b>회원가입</b>
              <p>JOIN OLIVE OPEN</p>
            </div>
            <form onSubmit={submit}>
              <div className="field"><label>아이디 *</label><input value={form.id} onChange={set('id')} required minLength={3} /></div>
              <div className="field"><label>비밀번호 * (8자 이상)</label><input type="password" value={form.password} onChange={set('password')} required minLength={8} /></div>
              <div className="field"><label>닉네임 *</label><input value={form.nick} onChange={set('nick')} required /></div>
              <div className="field"><label>연락처</label><input value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" /></div>
              <div className="field"><label>주소</label><input value={form.address} onChange={set('address')} /></div>
              <div className="field"><label>상세주소</label><input value={form.detail_address} onChange={set('detail_address')} /></div>
              {err && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
              <button className="authbtn">가입하기</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
