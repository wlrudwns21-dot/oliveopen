'use client';
import { useEffect, useState } from 'react';

/** window 커스텀 이벤트('oo-toast')로 토스트 표시. toast('메시지') 헬퍼 제공 */
export function toast(msg) {
  window.dispatchEvent(new CustomEvent('oo-toast', { detail: msg }));
}

export default function Toaster() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  useEffect(() => {
    let t;
    const on = (e) => {
      setMsg(e.detail); setShow(true);
      clearTimeout(t); t = setTimeout(() => setShow(false), 1700);
    };
    window.addEventListener('oo-toast', on);
    return () => { window.removeEventListener('oo-toast', on); clearTimeout(t); };
  }, []);
  return <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>;
}
