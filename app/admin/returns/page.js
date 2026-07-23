'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { won, dt, RETURN_STATUS } from '@/lib/format';

const REJECT_REASONS = ['반품 기한(수령 후 24시간) 초과', '상품 사용·개봉 흔적', '단순 변심 불가 상품', '증빙 사진 필요', '고객 귀책 사유', '재고 확인 결과 정상'];

export default function AdminReturns() {
  const [rows, setRows] = useState(null);
  const [reject, setReject] = useState(null); // 거절 대상 반품 행
  const [picked, setPicked] = useState('');
  const [text, setText] = useState('');
  const [toast, setToast] = useState('');

  const load = () => list('order_return').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  async function approve(r) {
    if (!confirm('반품을 승인하고 환불 처리할까요?')) return;
    try { await update('order_return', r.pk, { status: 'completed' }); say('승인했어요'); load(); }
    catch (e) { say(e.message); }
  }

  async function doReject() {
    const memo = text.trim() || picked;
    if (!memo) { say('거절 사유를 선택하거나 입력해 주세요'); return; }
    try {
      await update('order_return', reject.pk, { status: 'rejected', memo });
      setReject(null); say('거절 처리했어요'); load();
    } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><div><h1>반품 관리</h1><span className="sub">RETURNS</span></div></div>
      <div className="panel">
        <table className="atable">
          <thead><tr><th>번호</th><th>주문번호</th><th>고객</th><th>사유</th><th>경로</th><th>상태</th><th>처리 메모</th><th>접수일</th><th>처리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {(rows || []).map((r) => (
              <tr key={r.pk}>
                <td>{r.pk}</td>
                <td>{r.orders?.order_no || `#${r.order_pk}`} <span style={{ color: 'var(--muted)', fontSize: 11 }}>({won(r.orders?.total_amount)}원)</span></td>
                <td>{r.member?.nick}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '-'}</td>
                <td>{r.source}</td>
                <td><span className={`status-pill ${r.status === 'completed' ? 'st-green' : r.status === 'rejected' ? 'st-red' : 'st-orange'}`}>{RETURN_STATUS[r.status] || r.status}</span></td>
                <td style={{ maxWidth: 180, color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.memo || '-'}</td>
                <td>{dt(r.created_at)}</td>
                <td>
                  {r.status === 'requested' ? (
                    <>
                      <button className="btn btn-green btn-sm" onClick={() => approve(r)}>승인</button>{' '}
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => { setReject(r); setPicked(''); setText(''); }}>거절</button>
                    </>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>반품 접수가 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {reject && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setReject(null); }}>
          <div className="modal">
            <h3>반품 거절 · {reject.orders?.order_no || `#${reject.order_pk}`}</h3>
            <div style={{ background: '#f6f8f5', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12.5 }}>
              <b style={{ color: 'var(--green-ink)' }}>{reject.member?.nick}</b>님 반품 사유: {reject.reason || '-'}
            </div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#43503f', display: 'block', marginBottom: 8 }}>거절 사유 (고객에게 전달됩니다)</label>
            <div className="rt-chips">
              {REJECT_REASONS.map((r) => (
                <button key={r} className={`rt-chip ${picked === r && !text ? 'on' : ''}`} onClick={() => { setPicked(r); setText(''); }}>{r}</button>
              ))}
            </div>
            <textarea className="rt-ta" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="직접 입력 (선택)" />
            <div className="modal-acts">
              <button className="btn btn-line btn-sm" onClick={() => setReject(null)}>취소</button>
              <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={doReject}>거절 처리</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
