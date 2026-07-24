'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/adminApi';
import { won, dt, ORDER_STATUS } from '@/lib/format';
import ReferralDetail from '@/components/admin/ReferralDetail';

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [me, setMe] = useState(undefined); // undefined=확인중, null=일반관리자, {isPartner}
  useEffect(() => {
    fetch('/api/admin/me').then((r) => r.json()).then((j) => {
      const sess = j.session;
      if (sess?.isPartner) { setMe(sess); return; }
      setMe(null);
      api('dashboard').then(setD).catch(() => {});
    }).catch(() => setMe(null));
  }, []);

  // 파트너: 자기 코드 매출 현황만
  if (me?.isPartner) {
    return (
      <>
        <div className="adm-head"><div><h1>{me.company || me.nick} 매출 현황</h1><span className="sub">MY REFERRAL SALES</span></div></div>
        <ReferralDetail />
      </>
    );
  }
  if (me === undefined || !d) return <div className="empty">불러오는 중…</div>;

  const max = Math.max(1, ...d.days.map((x) => x.sum));
  const distTotal = Object.values(d.statusDist).reduce((a, b) => a + b, 0) || 1;
  const topMax = Math.max(1, ...(d.top.map(([, q]) => q)));

  return (
    <>
      <div className="adm-head">
        <div><h1>대시보드</h1><span className="sub">DASHBOARD</span></div>
        <div className="right"><span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{new Date().toLocaleDateString('ko-KR')}</span></div>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="k-ic">💰</div><span>총 매출</span><b>{won(d.kpi.totalSales)}원</b></div>
        <div className="kpi"><div className="k-ic">📦</div><span>주문 수</span><b>{won(d.kpi.orderCount)}건</b></div>
        <div className="kpi"><div className="k-ic">👥</div><span>회원 수</span><b>{won(d.kpi.memberCount)}명</b></div>
        <div className="kpi"><div className="k-ic">🧾</div><span>객단가</span><b>{won(d.kpi.avg)}원</b></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <h2>최근 7일 매출</h2>
          <div className="bar-row">
            {d.days.map((x) => (
              <div key={x.label} className="bar" style={{ height: `${Math.round((x.sum / max) * 100)}%` }} title={`${x.label}: ${won(x.sum)}원`} />
            ))}
          </div>
          <div className="bar-lab">{d.days.map((x) => <span key={x.label}>{x.label}</span>)}</div>
        </div>
        <div className="panel">
          <h2>주문 상태 분포</h2>
          {Object.entries(d.statusDist).map(([st, n]) => (
            <div key={st} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{ORDER_STATUS[st] || st}</span><b>{n}</b>
              </div>
              <div className="freebar"><i style={{ width: `${Math.round((n / distTotal) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <div className="panel">
          <h2>최근 주문</h2>
          <table className="atable" style={{ minWidth: 0 }}>
            <thead><tr><th>주문번호</th><th>고객</th><th>상태</th><th>금액</th><th>일시</th></tr></thead>
            <tbody>
              {d.recent.map((o) => (
                <tr key={o.pk}>
                  <td>{o.order_no || `#${o.pk}`}</td>
                  <td>{o.member?.nick || '-'}</td>
                  <td>{ORDER_STATUS[o.status] || o.status}</td>
                  <td>{won(o.total_amount)}원</td>
                  <td>{dt(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h2>인기 상품 TOP5</h2>
          {d.top.map(([name, qty]) => (
            <div key={name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{name}</span><b>{qty}개</b>
              </div>
              <div className="freebar"><i style={{ width: `${Math.round((qty / topMax) * 100)}%` }} /></div>
            </div>
          ))}
          {!d.top.length && <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>아직 판매 데이터가 없어요</p>}
        </div>
      </div>
    </>
  );
}
