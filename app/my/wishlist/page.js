'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MyHeader from '@/components/MyHeader';
import PhoneNav from '@/components/PhoneNav';
import { won } from '@/lib/format';

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState(null);

  async function load() {
    const res = await fetch('/api/wishlist');
    if (res.status === 401) { router.push('/login?next=/my/wishlist'); return; }
    const j = await res.json();
    setItems(j.items || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(pk) {
    await fetch('/api/wishlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pk }) });
    load();
  }

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <MyHeader title="찜한 상품" sub="WISHLIST" />
          {items === null && <div className="empty" style={{ padding: '60px 20px' }}>불러오는 중…</div>}
          {items && !items.length && (
            <div className="cartempty">
              <div className="ce-ic" style={{ fontSize: 28 }}>❤️</div>
              <b>찜한 상품이 없어요</b>
              <p>마음에 드는 과일을 하트로 담아보세요.</p>
              <Link href="/category" className="ce-go">과일 보러 가기</Link>
            </div>
          )}
          {items && items.length > 0 && (
            <div className="grid" style={{ padding: '14px 20px 0' }}>
              {items.map((w) => {
                const dc = w.was && w.was > w.price ? Math.round((1 - w.price / w.was) * 100) : 0;
                return (
                  <article key={w.pk} className="card">
                    <div className="pic">
                      <Link href={`/product/${w.sku}`}><img src={w.img} alt={w.name} /></Link>
                      <button className="heart" onClick={() => remove(w.pk)} aria-label="찜 해제" style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)' }}>✕</button>
                    </div>
                    <Link href={`/product/${w.sku}`} className="body">
                      <div className="sb" style={{ minHeight: 0, color: 'var(--muted)', fontSize: 10.5 }}>{w.origin}</div>
                      <div className="nm">{w.name}</div>
                      <div className="pr">
                        {dc > 0 && <span className="dc">{dc}%</span>}
                        <span className="pp">{won(w.price)}<small>원</small></span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
          <div style={{ height: 20 }} />
        </div>
        <PhoneNav />
      </div>
    </div>
  );
}
