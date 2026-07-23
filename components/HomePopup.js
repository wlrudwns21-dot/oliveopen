'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IcX } from './icons';

/** 홈 진입 시 노출되는 공지 팝업 (오늘 하루 보지 않기 지원) */
export default function HomePopup({ popups = [] }) {
  const [queue, setQueue] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const show = (popups || []).filter((p) => {
      try { return localStorage.getItem(`oo_popup_hide_${p.id}`) !== today; }
      catch { return true; }
    });
    // 인트로 스플래시가 끝난 뒤 뜨도록 살짝 지연
    const t = setTimeout(() => { setQueue(show); setReady(true); }, sessionStorage.getItem('oo_intro_seen') ? 200 : 2800);
    return () => clearTimeout(t);
  }, []);

  if (!ready || !queue.length) return null;
  const p = queue[0];
  const close = () => setQueue((q) => q.slice(1));
  const hideToday = () => {
    try { localStorage.setItem(`oo_popup_hide_${p.id}`, new Date().toISOString().slice(0, 10)); } catch {}
    close();
  };

  return (
    <div className="popup-scrim" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="popup">
        <button className="popup-x" onClick={close} aria-label="닫기"><IcX /></button>
        {p.image && (
          p.link
            ? <Link href={p.link} onClick={close}><img src={p.image} alt={p.title || ''} /></Link>
            : <img src={p.image} alt={p.title || ''} />
        )}
        {(p.title || p.body || (p.link && p.linkText)) && (
          <div className="popup-body">
            {p.title && <h3>{p.title}</h3>}
            {p.body && <p>{p.body}</p>}
            {p.link && p.linkText && <Link href={p.link} className="popup-cta" onClick={close}>{p.linkText}</Link>}
          </div>
        )}
        <div className="popup-foot">
          <button onClick={hideToday}>오늘 하루 보지 않기</button>
          <button onClick={close}>닫기</button>
        </div>
      </div>
    </div>
  );
}
