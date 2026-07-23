import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getActiveProducts, getCartCount, getSiteConf, cardData, getWishedPks } from '@/lib/shop';
import { getMemberSession } from '@/lib/auth';
import PhoneNav from '@/components/PhoneNav';
import HeroCarousel from '@/components/HeroCarousel';
import ProductCard from '@/components/ProductCard';
import IntroSplash from '@/components/IntroSplash';
import Toaster from '@/components/Toaster';
import { IcBell, IcBag, IcSearch, IcCheck, IcChev, IcSun, IcCheckCircle, IcTruck } from '@/components/icons';

export const dynamic = 'force-dynamic';

// DB 설정(site_config)이 비어 있을 때 보여줄 기본 배너 — 디자인 프로토타입 3색 슬라이드
const DEFAULT_SLIDES = [
  { id: 's1', theme: 'green', eyebrow: 'Jeju Sun-ripened', title: '한 입에 퍼지는\n제주의 단맛', desc: '수확 당일 산지직송 · 평균 12 Brix⁺', cta: '지금 보기', link: '/product/gamgyul', image: '/assets/crop/gamgyul.png' },
  { id: 's2', theme: 'cream', eyebrow: 'Dawn Auction Direct', title: '새벽 경매에서\n식탁까지, 단 3단계', desc: '중간 유통 마진 제로 · 정직한 가격', cta: '왜 올리브 오픈인가', link: '/brand', image: '/assets/crop/cherry.png' },
  { id: 's3', theme: 'berry', eyebrow: "Today's Sweet", title: '톡 터지는\n보랏빛 건강 한 알', desc: '국내산 생블루베리 · 2차 정밀 선별', cta: '담으러 가기', link: '/category', image: '/assets/crop/blueberry.png' },
];

export default async function HomePage() {
  const [{ data: configs }, products, cartCount, wished] = await Promise.all([
    db().from('site_config').select('config_key, config_value'),
    getActiveProducts(),
    getCartCount(),
    getWishedPks(),
  ]);
  const { conf, slides } = getSiteConf(configs);
  const heroSlides = slides.length ? slides : DEFAULT_SLIDES;
  const text = conf['home_text'] || {};
  const banner = conf['home_banner'] || {};
  const session = getMemberSession();
  const cards = products.map(cardData);

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          {/* header */}
          <header className="topbar">
            <div className="brandrow">
              <div className="brand">
                <div className="wm">
                  <b>Olive Open</b>
                  <span>FRESH&nbsp;MARKET</span>
                </div>
              </div>
              <div className="icons">
                <Link href={session ? '/my' : '/login'} className="iconbtn" aria-label="알림"><IcBell /></Link>
                <Link href="/cart" className="iconbtn" aria-label="장바구니">
                  <IcBag />
                  {cartCount > 0 && <span className="badge">{cartCount}</span>}
                </Link>
              </div>
            </div>
          </header>

          {/* search */}
          <div className="searchwrap">
            <form action="/category" className="search">
              <IcSearch />
              <input type="text" name="q" placeholder={text.searchPlaceholder || '오늘 새벽 들어온 신선한 과일 검색'} aria-label="검색" />
            </form>
          </div>

          {/* hero carousel */}
          <HeroCarousel slides={heroSlides} />

          {/* categories */}
          <section className="sec" style={{ paddingBottom: 0 }}>
            <div className="sechead">
              <div>
                <div className="lab">Categories</div>
                <h3>{text.catTitle || '오늘 무엇을 담아볼까요'}</h3>
              </div>
            </div>
          </section>
          <div className="cats">
            {cards.map((p) => (
              <Link key={p.pk} href={`/category?f=${p.sku}`} className="cat">
                <div className="ring"><img src={p.img} alt={p.name} /></div>
                <span>{p.name.length > 5 ? p.name.slice(0, 5) : p.name}</span>
              </Link>
            ))}
          </div>

          {/* guarantee */}
          <section className="deliv">
            <span className="leaf">🌿</span>
            <div className="dl">
              <div className="et">Fresh Guarantee</div>
              <div className="dt"><b>{banner.title || '신선 보장제'}</b></div>
              <div className="dchips">
                <span className="dchip"><IcCheck /> 3만원 이상 전국 무료배송</span>
                <span className="dchip"><IcCheck /> 매일 새벽 산지직송</span>
              </div>
            </div>
            <Link href={banner.link || '/brand'} className="gobtn">{banner.cta || 'GO'}</Link>
          </section>

          {/* product grid */}
          <section className="sec" id="grid">
            <div className="sechead">
              <div>
                <div className="lab">{text.pickLabel || "MD's Pick"}</div>
                <h3>{text.pickTitle || '새벽 시장에서 고른 제철'}</h3>
              </div>
              <Link href="/category" className="more">전체보기 <IcChev w={2.2} /></Link>
            </div>
            <div className="grid" style={{ padding: 0 }}>
              {cards.map((p, i) => <ProductCard key={p.pk} p={p} rank={i + 1} wished={wished.has(p.pk)} />)}
            </div>
          </section>

          {/* promise */}
          <section className="promise">
            <div className="ph">
              <div className="e">Our Promise</div>
              <h4>올리브 오픈이 신선한 이유</h4>
            </div>
            <div className="pr3">
              <div className="it">
                <div className="ic"><IcSun /></div>
                <div className="t">새벽 경매 직송</div>
                <div className="d">잠든 새벽 2시,<br />당일 경매 매입</div>
              </div>
              <div className="it">
                <div className="ic"><IcCheckCircle /></div>
                <div className="t">2차 정밀 선별</div>
                <div className="d">무른 알은 한 알도<br />넣지 않아요</div>
              </div>
              <div className="it">
                <div className="ic"><IcTruck /></div>
                <div className="t">유통 마진 제로</div>
                <div className="d">시장 가격 그대로<br />정직하게</div>
              </div>
            </div>
          </section>

          <div className="footnote">
            <img src="/assets/logo-emblem.png" alt="" />
            <div className="fm">From Dawn Market</div>
            <p>가락시장에서 꼼꼼히 검수하고 안전하게 포장해 보냅니다.<br />수령 후 문제가 있으면 사진과 함께 고객센터로 연락 주세요.</p>
          </div>
        </div>

        <PhoneNav cartCount={cartCount} />
        <IntroSplash />
        <Toaster />
      </div>
    </div>
  );
}
