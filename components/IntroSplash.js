'use client';
import { useEffect, useState } from 'react';

export default function IntroSplash() {
  const [state, setState] = useState('pending'); // pending | show | hide | gone

  useEffect(() => {
    if (sessionStorage.getItem('oo_intro_seen')) { setState('gone'); return; }
    setState('show');
    sessionStorage.setItem('oo_intro_seen', '1');
    const t = setTimeout(() => setState('hide'), 2650);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state === 'hide') {
      const t = setTimeout(() => setState('gone'), 850);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (state === 'gone' || state === 'pending') return null;
  return (
    <div className={`intro ${state === 'hide' ? 'hide' : ''}`} onClick={() => setState('hide')}>
      <div className="iemb"><img src="/assets/logo-emblem.png" alt="올리브 오픈" /></div>
      <div className="iprog"><i /></div>
    </div>
  );
}
