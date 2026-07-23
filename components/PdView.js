'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { won } from '@/lib/format';
import Toaster, { toast } from './Toaster';
import { IcBack, IcShare, IcBag, IcHeart, IcX, IcTruck, IcCheck } from './icons';

export default function PdView({ p, options, reviews, loggedIn, cartCount: initialCount, wished = false }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const tabsRef = useRef(null);
  const [solid, setSolid] = useState(false);
  const [tab, setTab] = useState('detail');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(wished);
  const [mode, setMode] = useState('cart');
  const [cartCount, setCartCount] = useState(initialCount);

  const dc = p.was && p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;
  const opt = options[sel] || { price: p.price, label: '' };

  function goTab(t) {
    setTab(t);
    const top = tabsRef.current?.offsetTop || 0;
    scrollRef.current?.scrollTo({ top, behavior: 'smooth' });
  }

  function openSheet(m) { setMode(m); setQty(1); setOpen(true); }

  async function confirm(buyNow) {
    if (!loggedIn) { router.push(`/login?next=/product/${p.sku}`); return; }
    // 바로 구매: 장바구니를 거치지 않고 이 상품만 결제
    if (buyNow) {
      setOpen(false);
      router.push(`/checkout?buy=${p.pk}-${opt.pk || 0}-${qty}`);
      return;
    }
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_pk: p.pk, product_option_pk: opt.pk || null, quantity: qty }),
    });
    if (!res.ok) { toast('담기에 실패했어요'); return; }
    setOpen(false);
    setCartCount(cartCount + qty);
    toast('장바구니에 담았어요 🌿'); router.refresh();
  }

  async function toggleWish() {
    if (!loggedIn) { router.push(`/login?next=/product/${p.sku}`); return; }
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_pk: p.pk }),
    });
    const j = await res.json();
    setWish(j.added);
    toast(j.added ? '찜했어요 ❤️' : '찜을 해제했어요');
  }

  return (
    <div className="stage">
      <div className="phone pg-pd">
        <div className="scroll" ref={scrollRef} onScroll={(e) => setSolid(e.currentTarget.scrollTop > 300)}>
          {/* hero */}
          <div className="hero">
            <img src={p.heroImg} alt={p.name} />
            <div className="pick"><span className="ico">Fresh</span> 오늘 새벽 들어온 신선</div>
          </div>

          {/* info */}
          <div className="info">
            <span className="origin">📍 {p.origin}</span>
            <h1 className="pname">{p.name}</h1>
            <p className="psub">{p.sub}</p>
            <div className="rate">
              <span className="stars">★★★★★</span>
              <b>{Number(p.rating).toFixed(1)}</b>
              <span className="rev" onClick={() => goTab('review')}>리뷰 {won(p.reviewCount)}개</span>
            </div>
            <div className="priceblk">
              {dc > 0 && <span className="dc">{dc}%</span>}
              <span className="pp">{won(p.price)}<small>원~</small></span>
              {dc > 0 && <span className="was">{won(p.was)}원</span>}
            </div>
            <div className="fr6">3만원 이상 <b>무료배송</b> · 적립 {won(Math.round(p.price * 0.01))}원</div>
            <div className="badges">{(p.tags || []).map((b) => <span key={b} className="bdg">{b}</span>)}</div>
          </div>

          <div className="divider" />

          {/* delivery */}
          <div className="delivcard">
            <div className="delivrow">
              <IcTruck />
              <div className="k">배송</div>
              <div className="v"><b>새벽 산지직송</b> · 오늘 주문 시 내일/모레 도착<br />3만원 이상 구매 시 <b>전국 무료배송</b></div>
            </div>
            <div className="delivrow">
              <IcCheck w={1.8} />
              <div className="k">신선보장</div>
              <div className="v">맛없거나 문제가 있으면 <b>수령 후 24시간 내 100% 환불·교환</b></div>
            </div>
          </div>

          {/* tabs */}
          <div className="tabs" ref={tabsRef}>
            <button className={tab === 'detail' ? 'on' : ''} onClick={() => goTab('detail')}>상세정보</button>
            <button className={tab === 'review' ? 'on' : ''} onClick={() => goTab('review')}>후기</button>
            <button className={tab === 'ship' ? 'on' : ''} onClick={() => goTab('ship')}>배송·환불</button>
          </div>

          {/* detail */}
          <div className={`panel ${tab === 'detail' ? 'on' : ''}`}>
            <div className="detail-sec">
              <div className="lead">
                <div className="e">Product Story</div>
                <h3>산지에서 식탁까지의 이야기</h3>
              </div>
              {p.detailImg
                ? <img className="detail-img" src={p.detailImg} alt="상품 상세 정보" />
                : <div className="detail-none"><span className="em">🧺</span>상세 이미지를 준비 중이에요.<br />곧 따끈한 산지 소식으로 채워드릴게요.</div>}
            </div>
          </div>

          {/* review */}
          <div className={`panel ${tab === 'review' ? 'on' : ''}`}>
            <div className="rev-sum">
              <div className="big">{Number(p.rating).toFixed(1)}<span className="o5"> / 5</span></div>
              <div className="bars">
                {[86, 11, 2, 1, 0].map((w, i) => (
                  <div className="bl" key={i}><span className="t">{5 - i}점</span><span className="tr"><i style={{ width: `${w}%` }} /></span></div>
                ))}
              </div>
            </div>
            {reviews.map((r) => (
              <div className="review" key={r.pk}>
                <div className="rh">
                  <div className="rav">{(r.author || '올')[0]}</div>
                  <div><div className="rn">{r.author}</div><div className="rs">{'★'.repeat(r.rating)}</div></div>
                  <div className="rd">{(r.created_at || '').slice(0, 10)}</div>
                </div>
                <div className="rtx">{r.body}</div>
              </div>
            ))}
            {!reviews.length && <div className="detail-none">아직 후기가 없어요. 첫 후기를 남겨주세요 🌿</div>}
          </div>

          {/* ship */}
          <div className={`panel ${tab === 'ship' ? 'on' : ''}`}>
            <div className="ship-sec">
              <div className="ship-step"><div className="sn">01</div><div><div className="st">새벽 경매</div><div className="sd">매일 새벽 가락시장에서 산지 직송 과일을 당일 경매로 직접 매입합니다.</div></div></div>
              <div className="ship-step"><div className="sn">02</div><div><div className="st">정밀 선별·포장</div><div className="sd">당도·단단함·크기 기준을 통과한 상품만 2차 정밀 선별 후 충격 방지(에어캡) 포장합니다.</div></div></div>
              <div className="ship-step"><div className="sn">03</div><div><div className="st">당일 직배송</div><div className="sd">중간 도매·소매 단계 없이 매입 즉시 고객님께 곧장 보내드립니다.</div></div></div>
              <div className="guarantee">가락시장에서 꼼꼼히 검수하고 안전하게 포장해 보내지만, 신선식품 특성상 배송 중 문제가 생길 수 있습니다. 수령 후 상품에 문제가 있으면 사진을 찍어 고객센터로 연락 주세요. <b>신속하게 환불·교환을 도와드립니다.</b></div>
            </div>
          </div>
        </div>

        {/* top bar */}
        <header className={`topbar ${solid ? 'solid' : ''}`}>
          <button className="tbtn" aria-label="뒤로" onClick={() => router.back()}><IcBack /></button>
          <div className="tb-title">{p.name}</div>
          <div className="tb-r">
            <button className="tbtn" aria-label="공유" onClick={() => { navigator.clipboard?.writeText(location.href); toast('링크를 복사했어요'); }}><IcShare /></button>
            <button className="tbtn" aria-label="장바구니" onClick={() => router.push('/cart')}>
              <IcBag w={1.8} />
              {cartCount > 0 && <span className="badge" style={{ display: 'grid' }}>{cartCount}</span>}
            </button>
          </div>
        </header>

        {/* bottom bar */}
        <div className="buybar">
          <button className={`wish ${wish ? 'on' : ''}`} aria-label="찜" onClick={toggleWish}><IcHeart /></button>
          <button className="toCart" onClick={() => openSheet('cart')}>장바구니</button>
          <button className="toBuy" onClick={() => openSheet('buy')}>구매하기</button>
        </div>

        {/* option sheet */}
        <div className={`sheet-dim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
        <div className={`sheet ${open ? 'open' : ''}`}>
          <div className="grab" />
          <div className="sh-head"><b>옵션 선택</b>
            <button className="sh-x" onClick={() => setOpen(false)}><IcX /></button>
          </div>
          <div className="sh-body">
            <div className="opt-lab">구성 / 중량</div>
            {options.map((o, i) => (
              <div key={o.pk} className={`opt ${i === sel ? 'sel' : ''}`} onClick={() => setSel(i)}>
                <span className="ol">{o.label}</span>
                <span className="opr">
                  <span className="op">{won(o.price)}원</span>{' '}
                  {o.original_price ? <span className="ow">{won(o.original_price)}원</span> : null}
                </span>
              </div>
            ))}
            <div className="qty-row">
              <span className="ql">수량</span>
              <div className="stepper">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><b>{qty}</b><button onClick={() => setQty(qty + 1)}>+</button>
              </div>
            </div>
            <div className="sh-total">
              <span className="tl">총 상품금액</span>
              <span className="tv"><b>{won(opt.price * qty)}</b>원</span>
            </div>
          </div>
          <div className="sh-foot">
            <button className="c" onClick={() => confirm(false)}>장바구니 담기</button>
            <button className="b" onClick={() => confirm(true)}>바로 구매</button>
          </div>
        </div>

        <Toaster />
      </div>
    </div>
  );
}
