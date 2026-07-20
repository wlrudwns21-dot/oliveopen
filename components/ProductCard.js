'use client';
import { useRouter } from 'next/navigation';
import { won } from '@/lib/format';
import { IcHeart, IcPlus } from './icons';
import { toast } from './Toaster';

/** 프로토타입 .card 마크업 상품 카드 (p: {pk, sku, name, sub, price, was, img, tags, optionPk}) */
export default function ProductCard({ p, rank }) {
  const router = useRouter();
  const dc = p.was && p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;

  async function add(e) {
    e.stopPropagation();
    e.preventDefault();
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_pk: p.pk, product_option_pk: p.optionPk || null, quantity: 1 }),
    });
    if (res.status === 401) { router.push(`/login?next=/`); return; }
    toast(`${p.name} 담았어요`);
    router.refresh();
  }

  return (
    <article className="card" onClick={() => router.push(`/product/${p.sku}`)}>
      <div className="pic">
        <img src={p.img} alt={p.name} />
        {rank ? <div className="rank">{rank}</div> : null}
        <div className="heart"><IcHeart w={2} /></div>
        <button className="add" aria-label="담기" onClick={add}><IcPlus /></button>
      </div>
      <div className="body">
        <div className="nm">{p.name}</div>
        <div className="sb">{p.sub}</div>
        <div className="pr">
          {dc > 0 && <span className="dc">{dc}%</span>}
          <span className="pp">{won(p.price)}<small>원</small></span>
          {dc > 0 && <span className="was">{won(p.was)}원</span>}
        </div>
        <div className="tags">{(p.tags || []).slice(0, 2).map((t) => <span key={t} className="tg">{t}</span>)}</div>
      </div>
    </article>
  );
}
