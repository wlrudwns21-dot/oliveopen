import Link from 'next/link';
import { getEvent, getCartCount, getWishedPks } from '@/lib/shop';
import { getMemberSession } from '@/lib/auth';
import PhoneNav from '@/components/PhoneNav';
import ProductCard from '@/components/ProductCard';
import Toaster from '@/components/Toaster';
import { IcBack } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }) {
  const [data, cartCount, wished] = await Promise.all([getEvent(params.slug), getCartCount(), getWishedPks()]);

  if (!data || (!data.event.is_active)) {
    return (
      <div className="stage"><div className="phone pg-app"><div className="view">
        <header className="viewhead"><Link href="/" className="iconbtn" style={{ marginLeft: -6 }}><IcBack /></Link><div className="ht"><h1>이벤트</h1></div></header>
        <div className="empty" style={{ paddingTop: 60 }}>진행 중인 이벤트가 아니에요</div>
      </div></div></div>
    );
  }
  const { event, products } = data;
  const period = event.starts_at && event.ends_at ? `${event.starts_at} ~ ${event.ends_at}` : '';

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <Link href="/" className="iconbtn" aria-label="홈" style={{ marginLeft: -6 }}><IcBack /></Link>
            <div className="ht"><h1>이벤트</h1><span className="vsub">SPECIAL EVENT</span></div>
          </header>

          {/* 이벤트 히어로 */}
          <div className={`event-hero ${event.theme || 'green'}`}>
            {event.hero_image && <img src={event.hero_image} alt="" />}
            <div className="ov" />
            <div className="txt">
              {event.badge && <span className="ev-badge">{event.badge}</span>}
              <h2>{event.title}</h2>
              {event.subtitle && <p>{event.subtitle}</p>}
              {period && <div className="ev-period">📅 {period}</div>}
            </div>
          </div>

          {event.description && (
            <p style={{ padding: '16px 20px 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>{event.description}</p>
          )}

          <div style={{ padding: '14px 20px 0' }}>
            <Link href="/gift" className="btn btn-green" style={{ width: '100%', height: 50, fontSize: 15 }}>🎁 추석 선물 신청하기 (받는 분께 바로 배송)</Link>
          </div>
          <p style={{ padding: '8px 20px 0', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            받는 분 주소로 직접 보내는 선물 신청 · 배송 희망일 지정 가능
          </p>

          <div className="grid" style={{ padding: '16px 20px 0' }}>
            {products.map((p) => <ProductCard key={p.pk} p={p} wished={wished.has(p.pk)} />)}
          </div>
          {!products.length && <div className="empty">준비 중인 특가 상품이 있어요</div>}
          <div style={{ height: 24 }} />
        </div>
        <PhoneNav cartCount={cartCount} />
        <Toaster />
      </div>
    </div>
  );
}
