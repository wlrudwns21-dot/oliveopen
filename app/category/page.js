import Link from 'next/link';
import { getActiveProducts, getCartCount, cardData, getWishedPks, getCategories } from '@/lib/shop';
import PhoneNav from '@/components/PhoneNav';
import ProductCard from '@/components/ProductCard';
import Toaster from '@/components/Toaster';
import { IcBag } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ searchParams }) {
  const [products, cartCount, wished, categories] = await Promise.all([
    getActiveProducts(), getCartCount(), getWishedPks(), getCategories(),
  ]);
  const cards = products.map(cardData);
  const cur = searchParams?.c || 'all';          // 카테고리 pk (문자열) 또는 'all'
  const q = (searchParams?.q || '').trim();

  let list = cur === 'all' ? cards : cards.filter((p) => String(p.categoryPk) === String(cur));
  if (q) list = list.filter((p) => p.name.includes(q) || p.sub.includes(q));
  const curCat = categories.find((c) => String(c.pk) === String(cur));
  const curLabel = cur === 'all' ? '전체' : (curCat?.name || '카테고리');

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <div className="ht"><h1>카테고리</h1><span className="vsub">SHOP BY CATEGORY</span></div>
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
              {categories.map((c) => (
                <Link key={c.pk} href={`/category?c=${c.pk}`} className={String(cur) === String(c.pk) ? 'on' : ''}>
                  {c.name}
                </Link>
              ))}
            </nav>
            <div className="cmain">
              <h2>{curLabel} · {list.length}개</h2>
              <div className="cgrid">
                {list.map((p) => <ProductCard key={p.pk} p={p} wished={wished.has(p.pk)} />)}
              </div>
              {!list.length && <div style={{ textAlign: 'center', color: '#9aa08c', fontSize: 13, padding: '40px 0' }}>이 카테고리에 상품이 없어요</div>}
            </div>
          </div>
        </div>
        <PhoneNav cartCount={cartCount} />
        <Toaster />
      </div>
    </div>
  );
}
