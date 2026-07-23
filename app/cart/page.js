'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneNav from '@/components/PhoneNav';
import { won } from '@/lib/format';
import { IcBag, IcTrash } from '@/components/icons';

export default function CartPage() {
  const router = useRouter();
  const [lines, setLines] = useState(null);
  const [shipping, setShipping] = useState({ freeThreshold: 30000, fee: 3000 });

  async function load() {
    const res = await fetch('/api/cart');
    if (res.status === 401) { router.push('/login?next=/cart'); return; }
    const j = await res.json();
    setLines(j.lines || []);
    if (j.shipping) setShipping(j.shipping);
  }
  useEffect(() => { load(); }, []);

  async function setQty(pk, quantity) {
    await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pk, quantity }),
    });
    load();
    router.refresh();
  }

  const total = (lines || []).reduce((a, l) => a + l.price * l.qty, 0);
  const wasTotal = (lines || []).reduce((a, l) => a + (l.was || l.price) * l.qty, 0);
  const fee = total === 0 || total >= shipping.freeThreshold ? 0 : shipping.fee;
  const remain = Math.max(0, shipping.freeThreshold - total);
  const pct = Math.min(100, Math.round((total / shipping.freeThreshold) * 100));
  const count = (lines || []).reduce((a, l) => a + l.qty, 0);

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <div className="ht"><h1>장바구니</h1><span className="vsub">{count}개 담김</span></div>
          </header>

          {lines === null && (
            <div className="cartempty"><p>불러오는 중…</p></div>
          )}

          {lines && lines.length === 0 && (
            <div className="cartempty">
              <div className="ce-ic"><IcBag w={1.6} /></div>
              <b>장바구니가 비어 있어요</b>
              <p>새벽 산지에서 갓 들어온 과일을 담아보세요.</p>
              <button className="ce-go" onClick={() => router.push('/')}>신선한 과일 보러 가기</button>
            </div>
          )}

          {lines && lines.length > 0 && (
            <>
              <div className="shipbar">
                <div className="stx">
                  {remain > 0
                    ? <><b>{won(remain)}원</b> 더 담으면 무료배송!</>
                    : '🌿 무료배송 조건을 충족했어요!'}
                </div>
                <div className="track"><i style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="cart">
                {lines.map((l) => (
                  <div key={l.pk} className="citem">
                    <div className="ci-pic"><img src={l.img} alt={l.name} /></div>
                    <div className="ci-b">
                      <div className="ci-nm">{l.name}</div>
                      {l.option && <div className="ci-op">{l.option}</div>}
                      <div className="ci-pr">
                        {won(l.price * l.qty)}원 {l.was ? <small>{won(l.was * l.qty)}원</small> : null}
                      </div>
                      <div className="ci-row">
                        <div className="stepper">
                          <button onClick={() => setQty(l.pk, l.qty - 1)}>−</button>
                          <b>{l.qty}</b>
                          <button onClick={() => setQty(l.pk, l.qty + 1)}>+</button>
                        </div>
                        <button className="ci-del" aria-label="삭제" onClick={() => setQty(l.pk, 0)}><IcTrash /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="summary">
                <div className="row"><span>상품 금액</span><span>{won(total)}원</span></div>
                <div className="row"><span>배송비</span><span>{fee === 0 ? '무료' : `${won(fee)}원`}</span></div>
                <div className="row total"><span>총 결제금액</span><b>{won(total + fee)}원</b></div>
              </div>
              <button className="bigbtn" onClick={() => router.push('/checkout')}>{won(total + fee)}원 결제하기</button>
            </>
          )}
        </div>
        <PhoneNav cartCount={count} />
      </div>
    </div>
  );
}
