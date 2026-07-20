import Link from 'next/link';
import { db } from '@/lib/supabase';
import { IcBack, IcChev } from '@/components/icons';

export const dynamic = 'force-dynamic';

const MONTH_LABEL = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SEASON_OF = (m) => (m >= 3 && m <= 5 ? '봄' : m >= 6 && m <= 8 ? '여름' : m >= 9 && m <= 11 ? '가을' : '겨울');

export default async function SeasonPage({ searchParams }) {
  const now = new Date().getMonth() + 1;
  const sel = Math.min(12, Math.max(1, Number(searchParams?.m) || now));
  const { data: items } = await db()
    .from('seasonal_item')
    .select('*, product(sku)')
    .eq('is_active', true)
    .order('sort_order');
  const fruits = (items || []).map((f) => ({ ...f, months: f.months || [] }));

  const inSeason = (f, m) => f.months.includes(m);
  const isStart = (f) => f.months[0] === sel;
  const isEnd = (f) => f.months[f.months.length - 1] === sel;
  const picked = fruits.filter((f) => inSeason(f, sel)).sort((a, b) => {
    const rank = (f) => (isEnd(f) ? 0 : isStart(f) ? 2 : 1);
    return rank(a) - rank(b);
  });
  const ending = picked.filter(isEnd);
  const rangeLabel = (f) => `${f.months[0]}~${f.months[f.months.length - 1]}월`;
  const badgeFor = (f) => (isEnd(f) ? { cls: 'end', txt: '이번 달 마지막 ⏰' } : isStart(f) ? { cls: 'start', txt: '이제 시작 🌱' } : { cls: 'now', txt: '지금 제철 ✓' });

  return (
    <div className="stage">
      <div className="phone pg-season">
        <header className="topbar">
          <Link href="/lounge" className="bk" aria-label="뒤로"><IcBack /></Link>
          <h1>제철 캘린더</h1>
        </header>

        <div className="scroll">
          {/* hero */}
          <div className="hero">
            <div className="glow" />
            <div className="ey">Seasonal Calendar</div>
            <div className="big">
              <div className="mn">{sel}</div>
              <div className="mtxt">월, 지금 제철<small>가장 맛있는 순간을 놓치지 마세요</small></div>
            </div>
            <div className="sub">
              {SEASON_OF(sel)}의 제철 과일 <b>{picked.length}가지</b>
              {ending.length > 0 && <> · 이번 달 끝나는 <b>{ending.length}가지</b></>}
            </div>
          </div>

          {/* month selector */}
          <div className="months">
            {MONTH_LABEL.map((lab, i) => (
              <Link key={lab} href={`/season?m=${i + 1}`} className={`mpill ${sel === i + 1 ? 'sel' : ''}`}>
                <span className="n">{lab}</span><span className="s">{SEASON_OF(i + 1)}</span>
              </Link>
            ))}
          </div>

          {/* urgency */}
          {ending.length > 0 && (
            <div className="urgent-banner" style={{ marginTop: 16 }}>
              <span className="ic">⏰</span>
              <div className="t"><b>{ending.map((f) => f.name).join(', ')}</b>는 이번 달이 지나면 제철이 끝나요. 지금 드세요!</div>
            </div>
          )}

          {/* NOW cards */}
          <section className="sec">
            <div className="seclab"><span className="e">Eat Now</span></div>
            <div className="sectitle">{sel}월 제철 <span className="cnt">{picked.length}</span></div>
            <div className="nowgrid">
              {picked.map((f) => {
                const b = badgeFor(f);
                const inner = (
                  <>
                    {f.product?.sku && <span className="shoptag">판매중</span>}
                    <div className="dot" style={{ background: `${f.color}1f` }}>{f.emoji}</div>
                    <div className="info">
                      <div className="nm">{f.name}</div>
                      <div className="og">{f.origin}</div>
                      <div className="pk">성수기 {rangeLabel(f)}</div>
                    </div>
                    <span className={`sbadge ${b.cls}`}>{b.txt}</span>
                    {f.product?.sku && <span className="go"><IcChev /></span>}
                  </>
                );
                return f.product?.sku
                  ? <Link key={f.pk} href={`/product/${f.product.sku}`} className={`ncard ${b.cls === 'end' ? 'ending' : ''}`}>{inner}</Link>
                  : <div key={f.pk} className={`ncard ${b.cls === 'end' ? 'ending' : ''}`}>{inner}</div>;
              })}
            </div>
          </section>

          {/* year graph */}
          <section className="sec" style={{ paddingBottom: 0 }}>
            <div className="seclab"><span className="e">Year Map</span></div>
            <div className="sectitle">한 해 제철 그래프</div>
          </section>
          <div className="graph-wrap">
            <div className="ghead">
              <div className="corner">과일</div>
              {MONTH_LABEL.map((_, i) => <div key={i} className={`mh ${sel === i + 1 ? 'sel' : ''}`}>{i + 1}</div>)}
            </div>
            {fruits.map((f) => (
              <div key={f.pk} className="grow">
                <div className="lab"><span className="em">{f.emoji}</span>{f.name}</div>
                {MONTH_LABEL.map((_, i) => {
                  const m = i + 1;
                  const on = inSeason(f, m);
                  const prev = inSeason(f, m - 1);
                  const next = m + 1 <= 12 ? inSeason(f, m + 1) : false;
                  const rad = on ? `${!prev ? 4 : 0}px ${!next ? 4 : 0}px ${!next ? 4 : 0}px ${!prev ? 4 : 0}px` : '4px';
                  return (
                    <div key={m} className={`gcell ${m === sel && on ? 'selcol' : ''}`} style={{ color: f.color }}>
                      {on && <span className="bar" style={{ background: f.color, borderRadius: rad }} />}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="glegend">
              <span><i /> 제철 기간</span>
              <span><i style={{ boxShadow: '0 0 0 1.5px #fff, 0 0 0 2.5px var(--green2)' }} /> 선택한 달</span>
            </div>
          </div>

          {/* CTA */}
          <div className="cta-sec">
            <div className="q">“지금 이 순간이 가장 맛있어요.”</div>
            <Link href="/category" className="cta-btn">제철 과일 담으러 가기 <IcChev w={2.6} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
