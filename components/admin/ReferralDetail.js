'use client';
import { useEffect, useState } from 'react';
import { won, dt, ORDER_STATUS } from '@/lib/format';

const GRADE_C = { GREEN: 'st-green', GOLD: 'st-orange', VIP: 'st-purple' };

/** 특정 추천 코드의 매출·고객 상세. code 미지정 시 서버가 로그인 파트너의 코드로 처리 */
export default function ReferralDetail({ code }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setD(null); setErr('');
    fetch(`/api/admin/referral-report${code ? `?code=${encodeURIComponent(code)}` : ''}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => { if (!ok) setErr(j.error || '조회 실패'); else setD(j); })
      .catch(() => setErr('조회 실패'));
  }, [code]);

  if (err) return <div className="empty">{err}</div>;
  if (!d) return <div className="empty">불러오는 중…</div>;

  return (
    <>
      <div style={{ marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>
        추천 코드 <b style={{ color: 'var(--green-ink)' }}>{d.code}</b>
        {d.referrer ? ` · 추천인 ${d.referrer}` : ''}{d.couponName ? ` · ${d.couponName}` : ''}
      </div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi"><div className="k-ic">👥</div><span>추천 가입 고객</span><b>{won(d.totals.customerCount)}명</b></div>
        <div className="kpi"><div className="k-ic">🧾</div><span>쿠폰 사용 주문</span><b>{won(d.totals.orderCount)}건</b></div>
        <div className="kpi"><div className="k-ic">💰</div><span>발생 매출</span><b>{won(d.totals.totalSales)}원</b></div>
      </div>

      <div className="panel">
        <h2>추천 가입 고객 ({d.customers.length})</h2>
        <table className="atable">
          <thead><tr><th>아이디</th><th>닉네임</th><th>등급</th><th>가입일</th></tr></thead>
          <tbody>
            {d.customers.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td><td>{c.nick}</td>
                <td><span className={`status-pill ${GRADE_C[c.grade] || 'st-gray'}`}>{c.grade}</span></td>
                <td>{dt(c.created_at)}</td>
              </tr>
            ))}
            {!d.customers.length && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>추천 가입 고객이 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>쿠폰 사용 주문 ({d.orders.length})</h2>
        <table className="atable">
          <thead><tr><th>주문번호</th><th>고객</th><th>상태</th><th>금액</th><th>일시</th></tr></thead>
          <tbody>
            {d.orders.map((o) => (
              <tr key={o.order_no}>
                <td>{o.order_no}</td>
                <td>{o.member?.nick || '-'}</td>
                <td>{ORDER_STATUS[o.status] || o.status}</td>
                <td>{won(o.total_amount)}원</td>
                <td>{dt(o.created_at)}</td>
              </tr>
            ))}
            {!d.orders.length && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>사용 주문이 없어요</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
