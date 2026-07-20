import Link from 'next/link';
import { getActiveProducts, getCartCount, cardData } from '@/lib/shop';
import PhoneNav from '@/components/PhoneNav';
import ProductCard from '@/components/ProductCard';
import Toaster from '@/components/Toaster';
import { IcSearch, IcBag } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ searchParams }) {
  const [products, cartCount] = await Promise.all([getActiveProducts(), getCartCount()]);
  const cards = products.map(cardData);
  const cur = searchParams?.f || 'all';
  const q = (searchParams?.q || '').trim();
  let list = cur === 'all' ? cards : cards.filter((p) => p.sku === cur);
  if (q) list = list.filter((p) => p.name.includes(q) || p.sub.includes(q));
  const curLabel = cur === 'all' ? '전체' : (cards.find((p) => p.sku === cur)?.name || '전체');

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <div className="ht"><h1>카테고리</h1><span className="vsub">SHOP BY FRUIT</span></div>
            <div className="hicons">
              <Link href="/cart" className="iconbtn" aria-label="장바구니">
                <IcBag />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
            </div>
          </header>
          <div className="catpage">
            <nav className="crail">
              <Link href="/category" className={cur === 'all' ? 'on' : ''}>전체</Link>
              {cards.map((p) => (
                <Link key={p.pk} href={`/category?f=${p.sku}`} className={cur === p.sku ? 'on' : ''}>
                  {p.name.length > 5 ? p.name.slice(0, 5) : p.name}
                </Link>
              ))}
            </nav>
            <div className="cmain">
              <h2>{curLabel} · {list.length}개</h2>
              <div className="cgrid">
                {list.map((p) => <ProductCard key={p.pk} p={p} />)}
              </div>
              {!list.length && <div style={{ textAlign: 'center', color: '#9aa08c', fontSize: 13, padding: '40px 0' }}>검색 결과가 없어요</div>}
            </div>
          </div>
        </div>
        <PhoneNav cartCount={cartCount} />
        <Toaster />
      </div>
    </div>
  );
}
