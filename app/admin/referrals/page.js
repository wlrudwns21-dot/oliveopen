'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/adminApi';
import { won } from '@/lib/format';
import ReferralDetail from '@/components/admin/ReferralDetail';

export default function AdminReferrals() {
  const [list, setList] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => { api('referral-report').then((j) => setList(j.list || [])).catch(() => setList([])); }, []);

  return (
    <>
      <div className="adm-head"><div><h1>추천 매출 조회</h1><span className="sub">REFERRAL SALES</span></div></div>
      <p className="sectit">추천인(쿠폰 발급자)별로 추천 가입 고객과 쿠폰 사용 매출을 통합 조회합니다. 행을 클릭하면 상세가 열립니다.</p>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>추천 코드</th><th>추천인</th><th>쿠폰명</th><th>추천 가입</th><th>사용 주문</th><th>발생 매출</th><th></th></tr></thead>
          <tbody>
            {list === null && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {(list || []).map((r) => (
              <tr key={r.code} style={{ cursor: 'pointer', background: sel === r.code ? '#f3f6f2' : undefined }} onClick={() => setSel(r.code)}>
                <td style={{ fontWeight: 700 }}>{r.code}</td>
                <td>{r.referrer || '-'}</td>
                <td>{r.name}</td>
                <td>{won(r.customerCount)}명</td>
                <td>{won(r.orderCount)}건</td>
                <td style={{ fontWeight: 800, color: 'var(--green-ink)' }}>{won(r.totalSales)}원</td>
                <td><button className="btn btn-line btn-sm" onClick={(e) => { e.stopPropagation(); setSel(r.code); }}>상세</button></td>
              </tr>
            ))}
            {list && !list.length && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>추천 쿠폰이 없어요. 쿠폰·프로모션에서 "추천인 코드로 사용"을 켜서 만들어 보세요.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="panel">
          <ReferralDetail code={sel} />
        </div>
      )}
    </>
  );
}
