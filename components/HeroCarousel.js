'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IcChev } from './icons';

export default function HeroCarousel({ slides }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || slides.length < 2) return;
    const timer = setInterval(() => {
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length;
      el.scrollTo({ left: next * (el.clientWidth + 14), behavior: 'smooth' });
    }, 4200);
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth));
    const stop = () => clearInterval(timer);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchstart', stop, { passive: true });
    return () => { clearInterval(timer); el.removeEventListener('scroll', onScroll); el.removeEventListener('touchstart', stop); };
  }, [slides.length]);

  if (!slides.length) return null;
  return (
    <section className="hero">
      <div className="htrack" ref={ref}>
        {slides.map((s) => (
          s.mode === 'image' && s.fullImage ? (
            // 통 이미지 배너
            <Link key={s.id} href={s.link || '/'} className="hslide" style={{ padding: 0, overflow: 'hidden' }}>
              <img src={s.fullImage} alt={s.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Link>
          ) : (
            // 구성형 배너 (색상·문구 + 참고 이미지)
            <article key={s.id} className={`hslide ${s.theme || 'green'}`}>
              <div className="copy">
                <div className="eyebrow">{s.eyebrow}</div>
                <h2>{s.title}</h2>
                <p>{s.desc}</p>
                <Link className="hcta" href={s.link || '/'}>
                  {s.cta || '지금 보기'} <IcChev />
                </Link>
              </div>
              <div className="hart"><img src={s.image || '/assets/logo-emblem.png'} alt="" /></div>
            </article>
          )
        ))}
      </div>
      <div className="hdots">
        {slides.map((s, i) => <i key={s.id} className={i === idx ? 'on' : ''} />)}
      </div>
    </section>
  );
}
