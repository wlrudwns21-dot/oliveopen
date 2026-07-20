'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IcBack, IcChev } from '@/components/icons';

const FAQS = [
  { q: '제철이 지나면 못 사나요?', a: '제철 중심으로 운영합니다. 시즌이 지난 상품은 다음 제철에 다시 소개합니다.' },
  { q: '언제 받을 수 있나요?', a: '당일 발송하며 보통 다음날 수령합니다. (지역·상황에 따라 차이가 있을 수 있어요.)' },
  { q: '상품마다 크기가 다른가요?', a: '자연 농산물 특성상 다를 수 있으나, 중량·수량 기준으로 구성하며 품질은 동일합니다.' },
  { q: '왜 가락시장 직거래가 더 신선한가요?', a: '중간 도매·소매 단계를 거치지 않고 새벽 경매에서 바로 들여오기 때문에, 더 젊은 신선함을 더 낮은 가격에 드릴 수 있습니다.' },
];

export default function BrandPage() {
  const router = useRouter();
  const [solid, setSolid] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  return (
    <div className="stage">
      <div className="phone pg-brand">
        <div className="scroll" onScroll={(e) => setSolid(e.currentTarget.scrollTop > 360)}>
          {/* hero */}
          <div className="hero">
            <img src="/assets/brand/expert.jpg" alt="가락시장 전문가가 고른 신선한 과일" />
            <div className="hwrap">
              <div className="ey">Why Olive Open</div>
              <h1>좋은 과일을<br /><span className="b">가장 싸게</span> 만나는 방법.</h1>
            </div>
          </div>

          {/* intro */}
          <section className="sec">
            <div className="eyebrow">Brand Story</div>
            <div className="h2">중간 유통을 걷어낸<br />가락시장 직거래 신선마켓</div>
            <p className="lead">올리브 오픈은 <b>가락시장에서 과일을 직접</b> 들여옵니다. 복잡한 유통 단계를 없애 가격을 낮추고, 전문가가 고른 <b>제철 과일만</b> 소개합니다.</p>
            <div className="slogan"><div className="t">가락시장의 오늘을,<br />당신의 식탁으로.</div></div>

            {[
              { img: '/assets/brand/direct.jpg', t: '가락시장 직거래', d: '도매 현장과 직접 연결해 중간 비용을 없앱니다.' },
              { img: '/assets/brand/price.jpg', t: '가장 저렴한 가격', d: '유통 거품을 없애 회원에게 최저가로 드립니다.' },
              { img: '/assets/brand/season.jpg', t: '제철만 취급', d: '가장 맛있는 시기의 과일만 골라 소개합니다.' },
            ].map((x) => (
              <div className="principle" key={x.t}>
                <div className="pic"><img src={x.img} alt={x.t} /></div>
                <div><h3>{x.t}</h3><p>{x.d}</p></div>
              </div>
            ))}
          </section>

          {/* benefits */}
          <section className="sec benefits">
            <div className="eyebrow">4 Reasons</div>
            <div className="h2">왜 올리브 오픈일까요?</div>
            <div className="benefit hot">
              <div className="pic"><img src="/assets/brand/price.jpg" alt="최저가" /></div>
              <div className="no">01</div>
              <h3>가장 저렴한 가격</h3>
              <p>가락시장 직거래로 유통 거품을 없애 회원에게 최저가로 드립니다.</p>
              <span className="tag">최저가</span>
            </div>
            <div className="benefit">
              <div className="pic"><img src="/assets/brand/direct.jpg" alt="가락시장 직거래" /></div>
              <div className="no">02</div>
              <h3>가락시장 직거래</h3>
              <p>국내 최대 도매시장에서 직접 들여와 신선도와 가격을 동시에 잡았습니다.</p>
            </div>
            <div className="benefit">
              <div className="pic"><img src="/assets/brand/expert.jpg" alt="전문가 선별" /></div>
              <div className="no">03</div>
              <h3>전문가 직접 선별</h3>
              <p>수십 년 현장 경험의 전문가가 맛·당도·식감을 기준으로 고릅니다.</p>
            </div>
            <div className="benefit">
              <div className="pic"><img src="/assets/brand/delivery.jpg" alt="당일 발송" /></div>
              <div className="no">04</div>
              <h3>당일 발송, 다음날 도착</h3>
              <p>오늘 준비한 과일을 당일 발송해 다음날 신선하게 받아보세요.</p>
            </div>
          </section>

          {/* expert */}
          <section className="sec expert">
            <div className="eyebrow">Expert Selection</div>
            <div className="h2">가락시장 베테랑이<br />직접 고른 과일입니다.</div>
            <p className="lead">국내 최대 농산물 도매시장 가락시장. 올리브 오픈은 그 현장에서 쌓아온 전문가의 눈으로 과일을 선별합니다.</p>
            <div className="ximg"><img src="/assets/brand/auction.jpg" alt="가락시장 경매 현장" /></div>
            <div className="banner">맛을 아는 사람이 직접 고릅니다.</div>
            <div className="bbadges">
              <span className="bbadge">가락시장 직접 소싱</span>
              <span className="bbadge">전문가 직접 선별</span>
              <span className="bbadge">오랜 현장 경험</span>
            </div>
            <div className="excard"><h3>맛으로 고르는 기준</h3><p>겉모양보다 과즙·당도·식감을 현장에서 직접 확인합니다.</p></div>
            <div className="excard"><h3>산지와의 신뢰 관계</h3><p>오랜 네트워크로 좋은 산지 과일을 먼저 만납니다.</p></div>
            <div className="excard"><h3>제철 타이밍 감각</h3><p>언제 사고 언제 피할지 아는 경험이 맛을 결정합니다.</p></div>
            <div className="trust">“가락시장에서 시작한 신뢰,<br />회원의 식탁까지 이어집니다.”</div>
          </section>

          {/* process */}
          <section className="sec">
            <div className="eyebrow">Process</div>
            <div className="h2">발송부터 수령까지</div>
            <div className="ptop">오늘 발송, 내일 도착.</div>
            <div className="tl">
              {[
                ['1', '새벽 경매·직접 소싱', '가락시장 현장에서 전문가가 직접 들여옵니다.'],
                ['2', '제철 기준 선별', '가장 맛있는 시기를 기준으로 골라냅니다.'],
                ['3', '당일 안전 발송', '주문 상품을 손상 적은 포장으로 당일 발송합니다.'],
                ['4', '다음날 수령', '발송 다음날, 가장 신선한 상태로 받아보세요.'],
              ].map(([n, t, d], i) => (
                <div key={n}>
                  {i > 0 && <div className="tlbar" />}
                  <div className="tlstep"><div className="dot">{n}</div><div className="tb"><h3>{t}</h3><p>{d}</p></div></div>
                </div>
              ))}
            </div>
          </section>

          {/* storage + faq */}
          <section className="sec" style={{ paddingTop: 0 }}>
            <div className="eyebrow">Care & FAQ</div>
            <div className="h2">안심하고 받아보세요</div>
            <div className="sublab">보관법</div>
            <div className="store-grid">
              <div className="store"><div className="ic">❄️</div><h3>냉장 보관</h3><p>수령 후 바로 냉장. 직사광선·열기 피하기.</p></div>
              <div className="store"><div className="ic">🍃</div><h3>후숙 팁</h3><p>후숙 필요 과일은 실온 1~2일 후 냉장.</p></div>
              <div className="store"><div className="ic">💧</div><h3>세척 방법</h3><p>먹기 직전 흐르는 물에 세척.</p></div>
              <div className="store"><div className="ic">✨</div><h3>더 맛있게</h3><p>냉장에서 꺼내 5~10분 두면 향이 살아납니다.</p></div>
            </div>
            <div className="sublab">자주 묻는 질문</div>
            {FAQS.map((f, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>{f.q}<span className="arw">⌄</span></button>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </section>

          {/* final */}
          <section className="final">
            <div className="mk">OLIVE OPEN</div>
            <h2>가락시장의 오늘,<br />지금 식탁으로 받아보세요.</h2>
            <p>전문가가 고른 제철 과일을<br />가장 신선하게, 가장 합리적인 가격으로.</p>
            <button className="cta" onClick={() => router.push('/category')}>신선한 과일 보러 가기 <IcChev w={2.6} /></button>
            <div className="foot">주식회사 올리브 오픈 · 대표 김규영<br />경기도 성남시 수정구 둘래마로207번길 42, 2층<br />ⓒ 2026 OLIVE OPEN. All rights reserved.</div>
          </section>
        </div>

        <header className={`topbar ${solid ? 'solid' : ''}`}>
          <button className="tbtn" aria-label="뒤로" onClick={() => router.back()}><IcBack /></button>
          <div className="tb-title">왜 올리브 오픈일까요?</div>
        </header>
      </div>
    </div>
  );
}
