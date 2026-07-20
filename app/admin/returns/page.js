'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { won, dt, RETURN_STATUS } from '@/lib/format';

export default function AdminReturns() {
  const [rows, setRows] = useState(null);
  const [toast, setToast] = useState('');
  const load = () => list('order_return').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  async function act(r, status) {
    const label = status === 'completed' ? '승인(환불 처리)' : '거절';
    if (!confirm(`반품을 ${label}할까요?`)) return;
    try { await update('order_return', r.pk, { status }); say('처리했어요'); load(); }
    catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><h1>반품 관리</h1></div>
      <div className="panel">
        <table className="atable">
          <thead><tr><th>번호</th><th>주문번호</th><th>고객</th><th>사유</th><th>경로</th><th>상태</th><th>접수일</th><th>처리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {(rows || []).map((r) => (
              <tr key={r.pk}>
                <td>{r.pk}</td>
                <td>{r.orders?.order_no || `#${r.order_pk}`} ({won(r.orders?.total_amount)}원)</td>
                <td>{r.member?.nick}</td>
                <td>{r.reason || '-'}</td>
                <td>{r.source}</td>
                <td><span className={`status-pill ${r.status === 'completed' ? 'st-green' : r.status === 'rejected' ? 'st-red' : 'st-orange'}`}>{RETURN_STATUS[r.status] || r.status}</span></td>
                <td>{dt(r.created_at)}</td>
                <td>
                  {r.status === 'requested' ? (
                    <>
                      <button className="btn btn-sm btn-green" onClick={() => act(r, 'completed')}>승인</button>{' '}
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => act(r, 'rejected')}>거절</button>
                    </>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>반품 접수가 없어요</td></tr>}
          </tbody>
        </table>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
