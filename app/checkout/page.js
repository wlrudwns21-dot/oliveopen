'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { won, SHIP_FREE, SHIP_FEE } from '@/lib/format';
import Toaster, { toast } from '@/components/Toaster';
import { IcBack, IcCheck } from '@/components/icons';

export default function CheckoutPage() {
  const router = useRouter();
  const [lines, setLines] = useState(null);
  const [me, setMe] = useState(null);
  const [addr, setAddr] = useState({ recipient: '', phone: '', address: '', detail_address: '', zipcode: '' });
  const [editAddr, setEditAddr] = useState(false);
  const [memo, setMemo] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponDc, setCouponDc] = useState(0);
  const [usePoint, setUsePoint] = useState(false);
  const [pay, setPay] = useState('card');
  const [agreed, setAgreed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/cart');
      if (res.status === 401) { router.push('/login?next=/checkout'); return; }
      const j = await res.json();
      setLines(j.lines || []);
      const m = await fetch('/api/auth/me').then((r) => r.json()).catch(() => null);
      if (m?.address) setAddr(m.address);
      if (m?.member) setMe(m.member);
    })();
  }, []);

  const goods = (lines || []).reduce((a, l) => a + l.price * l.qty, 0);
  const wasGoods = (lines || []).reduce((a, l) => a + (l.was || l.price) * l.qty, 0);
  const itemDc = wasGoods - goods;
  const fee = goods === 0 || goods >= SHIP_FREE ? 0 : SHIP_FEE;
  const points = me?.points || 0;
  const pointUse = usePoint ? Math.min(points, Math.max(0, goods - couponDc)) : 0;
  const total = Math.max(0, goods + fee - couponDc - pointUse);

  async function toggleCoupon() {
    if (coupon) { setCoupon(null); setCouponDc(0); return; }
    const res = await fetch(`/api/coupon?total=${goods}`);
    const j = await res.json();
    if (res.ok) { setCoupon(j.coupon); setCouponDc(j.discount); toast(`${j.coupon.name} 적용`); }
    else toast(j.error || '적용 가능한 쿠폰이 없어요');
  }

  async function submit() {
    if (!agreed || busy) return;
    if (!addr.recipient || !addr.phone || !addr.address) { toast('배송지 정보를 입력해 주세요'); setEditAddr(true); return; }
    setBusy(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: addr, delivery_request: memo || null, payment_method: pay,
        coupon_code: coupon?.code || null, use_points: usePoint,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (res.ok) setDone(true);
    else toast(j.error || '결제에 실패했어요');
  }

  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });
  const empty = lines !== null && lines.length === 0;

  return (
    <div className="stage">
      <div className="phone pg-co">
        <header className="topbar">
          <button className="bk" aria-label="뒤로" onClick={() => router.back()}><IcBack /></button>
          <h1>주문 / 결제</h1>
        </header>

        {empty ? (
          <div className="emptybox">
            <div className="em">🧺</div>
            <b>주문할 상품이 없어요</b>
            <p>신선한 산지 직송 과일을 먼저 담아주세요.</p>
            <button onClick={() => router.push('/')}>과일 보러 가기</button>
          </div>
        ) : (
          <>
            <div className="scroll">
              {/* 배송지 */}
              <div className="card addr">
                <div className="ch">
                  <div><span className="e">Delivery</span><h2>배송지</h2></div>
                  <button className="edit" onClick={() => setEditAddr(!editAddr)}>{editAddr ? '완료' : '변경'}</button>
                </div>
                {!editAddr ? (
                  <>
                    <div className="who">
                      {addr.recipient ? <>{addr.recipient}님 <span className="tag">기본 배송지</span></> : '배송지를 등록해 주세요'}
                    </div>
                    <div className="line">{addr.address} {addr.detail_address}</div>
                    <div className="tel">{addr.phone}</div>
                  </>
                ) : (
                  <>
                    <input placeholder="받는 분" value={addr.recipient} onChange={set('recipient')} />
                    <input placeholder="연락처" value={addr.phone} onChange={set('phone')} />
                    <input placeholder="주소" value={addr.address} onChange={set('address')} />
                    <input placeholder="상세주소" value={addr.detail_address || ''} onChange={set('detail_address')} />
                  </>
                )}
                <div className="memo">
                  <select value={memo} onChange={(e) => setMemo(e.target.value)}>
                    <option value="">배송 요청사항을 선택하세요</option>
                    <option>문 앞에 두고 벨 눌러주세요</option>
                    <option>부재 시 경비실에 맡겨주세요</option>
                    <option>배송 전 미리 연락주세요</option>
                    <option>파손 위험 상품이니 주의해주세요</option>
                  </select>
                </div>
              </div>

              {/* 주문 상품 */}
              <div className="card">
                <div className="ch"><div><span className="e">Items</span><h2>주문 상품 <span style={{ color: 'var(--green2)' }}>{(lines || []).length}개</span></h2></div></div>
                {(lines || []).map((l) => (
                  <div key={l.pk} className="citem">
                    <div className="pic"><img src={l.img} alt={l.name} /></div>
                    <div className="b">
                      <div className="nm">{l.name}</div>
                      <div className="op">{l.option}</div>
                      <div className="pr"><span className="price">{won(l.price * l.qty)}원</span><span className="q">수량 {l.qty}개</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 할인 · 적립 */}
              <div className="card">
                <div className="ch"><div><span className="e">Benefit</span><h2>할인 · 적립</h2></div></div>
                <div className="brow">
                  <span className="k">쿠폰</span>
                  <div className="ctrl">
                    {coupon && <span className="val">-{won(couponDc)}원</span>}
                    <button className={`pill ${coupon ? 'applied' : ''}`} onClick={toggleCoupon}>{coupon ? '적용됨' : '자동 적용'}</button>
                  </div>
                </div>
                <div className="brow">
                  <span className="k">적립금 <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(보유 {won(points)}원)</span></span>
                  <div className="ctrl">
                    {usePoint && <span className="val">-{won(pointUse)}원</span>}
                    <button className={`pill ${usePoint ? 'applied' : ''}`} onClick={() => setUsePoint(!usePoint)}>{usePoint ? '사용됨' : '모두 사용'}</button>
                  </div>
                </div>
              </div>

              {/* 결제수단 */}
              <div className="card">
                <div className="ch"><div><span className="e">Payment</span><h2>결제 수단</h2></div></div>
                <div className="pays">
                  <div className={`pay ${pay === 'card' ? 'sel' : ''}`} onClick={() => setPay('card')}>💳 신용·체크카드</div>
                  <div className={`pay ${pay === 'kakao' ? 'sel' : ''}`} onClick={() => setPay('kakao')}><span className="kk">💬</span> 카카오페이</div>
                  <div className={`pay ${pay === 'naver' ? 'sel' : ''}`} onClick={() => setPay('naver')}><span className="nv">N</span> 네이버페이</div>
                  <div className={`pay ${pay === 'bank' ? 'sel' : ''}`} onClick={() => setPay('bank')}>🏦 무통장입금</div>
                </div>
              </div>

              {/* 결제금액 */}
              <div className="card sum">
                <div className="ch"><div><span className="e">Total</span><h2>결제 금액</h2></div></div>
                <div className="row"><span>상품 금액</span><span>{won(wasGoods)}원</span></div>
                <div className="row"><span>상품 할인</span><span className="red">-{won(itemDc)}원</span></div>
                <div className="row"><span>배송비</span><span>{fee === 0 ? '무료' : `${won(fee)}원`}</span></div>
                {coupon && <div className="row"><span>쿠폰 할인</span><span className="red">-{won(couponDc)}원</span></div>}
                {usePoint && <div className="row"><span>적립금 사용</span><span className="red">-{won(pointUse)}원</span></div>}
                <div className="row total"><span>총 결제금액</span><b>{won(total)}원</b></div>
                <div className="save-note">🌿 이번 주문으로 <b>{won(Math.round(total * 0.01))}원</b> 적립 예정{fee === 0 ? ' · 무료배송 적용' : ''}</div>
              </div>

              {/* 약관 */}
              <div className="card">
                <div className={`agree ${agreed ? 'on' : ''}`} onClick={() => setAgreed(!agreed)}>
                  <span className="box"><IcCheck w={3} /></span>
                  <span className="tx"><b>주문 내용을 확인했으며, 결제에 동의합니다.</b><br />(개인정보 수집·이용 및 제3자 제공 · 전자상거래 약관 동의 포함 · 테스트 결제로 실제 청구되지 않아요)</span>
                </div>
              </div>
            </div>

            <div className="paybar">
              <button className="paybtn" disabled={!agreed || busy} onClick={submit}>
                <span>{busy ? '결제 중…' : `${won(total)}원`}</span>{busy ? '' : ' 결제하기'}
              </button>
            </div>
          </>
        )}

        {/* success */}
        <div className={`done ${done ? 'show' : ''}`}>
          <div className="ck"><IcCheck /></div>
          <h2>주문이 완료되었어요!</h2>
          <div className="en">THANK YOU</div>
          <p>내일 새벽, 산지에서 갓 들어온<br />신선함을 곧 만나보실 수 있어요 🌿</p>
          <button className="ob" onClick={() => { router.push('/my'); router.refresh(); }}>주문 내역 보기</button>
        </div>

        <Toaster />
      </div>
    </div>
  );
}
