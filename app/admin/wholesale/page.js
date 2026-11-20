'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { dt } from '@/lib/format';

const ST = { pending: ['접수', 'st-orange'], approved: ['승인', 'st-green'], rejected: ['반려', 'st-red'] };
const CR = { none: '미신청', pending: '여신 신청', approved: '여신 승인', rejected: '여신 반려' };

export default function AdminWholesale() {
  const [rows, setRows] = useState(null);
  const [seg, setSeg] = useState('pending');
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const load = () => list('wholesale_account').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);

  const filtered = (rows || []).filter((r) => seg === 'all' || r.status === seg);

  async function setStatus(r, status) {
    let reject_reason = r.reject_reason;
    if (status === 'rejected') { reject_reason = prompt('반려 사유 (선택)') ?? r.reject_reason; }
    try { await update('wholesale_account', r.pk, { status, reject_reason }); say(status === 'approved' ? '승인했어요' : '처리했어요'); setDetail(null); load(); }
    catch (e) { say(e.message); }
  }

  async function setCredit(r, status) {
    let credit_limit = r.credit_limit || 0;
    if (status === 'approved') {
      const v = prompt('여신(세금계산서) 한도 — 원, 숫자만. 미정이면 0', String(r.credit_limit || 0));
      if (v === null) return;
      credit_limit = parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
    }
    try {
      await update('wholesale_account', r.pk, { credit_status: status, credit_limit, credit_approved_at: status === 'approved' ? new Date().toISOString() : null });
      say(status === 'approved' ? '여신을 승인했어요' : '여신을 처리했어요'); setDetail(null); load();
    } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><div><h1>도매 사업자 승인</h1><span className="sub">WHOLESALE ACCOUNTS</span></div></div>
      <div className="adm-toolbar"><div className="seg">
        {['pending', 'approved', 'rejected', 'all'].map((s) => <button key={s} className={seg === s ? 'on' : ''} onClick={() => setSeg(s)}>{s === 'all' ? '전체' : ST[s][0]}</button>)}
      </div></div>

      <div className="panel"><table className="atable">
        <thead><tr><th>상호</th><th>사업자번호</th><th>대표자</th><th>연락처</th><th>계정</th><th>상태</th><th>신청일</th><th></th></tr></thead>
        <tbody>
          {rows === null && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
          {filtered.map((r) => (
            <tr key={r.pk}>
              <td style={{ fontWeight: 700 }}>{r.company_name}</td>
              <td>{r.business_no}</td>
              <td>{r.owner_name || '-'}</td>
              <td>{r.contact_phone || '-'}</td>
              <td>{r.member?.id || '-'}</td>
              <td><span className={`status-pill ${ST[r.status]?.[1] || ''}`}>{ST[r.status]?.[0] || r.status}</span></td>
              <td>{dt(r.created_at)}</td>
              <td><button className="btn btn-line btn-sm" onClick={() => setDetail(r)}>상세</button></td>
            </tr>
          ))}
          {rows && !filtered.length && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>해당 상태의 신청이 없어요</td></tr>}
        </tbody>
      </table></div>

      {detail && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <h3>{detail.company_name} <span className={`status-pill ${ST[detail.status]?.[1]}`}>{ST[detail.status]?.[0]}</span></h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.9 }}>
              <b>사업자번호</b> {detail.business_no}<br />
              <b>대표자</b> {detail.owner_name || '-'}<br />
              <b>연락처</b> {detail.contact_phone || '-'} · {detail.contact_email || '-'}<br />
              <b>업종</b> {detail.industry || '-'} · <b>담당자</b> {detail.manager_name || '-'}<br />
              <b>사업장</b> {detail.address || '-'} {detail.detail_address || ''}<br />
              <b>계정</b> {detail.member?.id || '-'} · 신청 {dt(detail.created_at)}<br />
              <b>여신(세금계산서)</b> {CR[detail.credit_status || 'none']}{detail.credit_limit > 0 ? ` · 한도 ${detail.credit_limit.toLocaleString()}원` : ''}
              {detail.reject_reason ? <><br /><b>반려사유</b> {detail.reject_reason}</> : null}
            </p>
            {detail.cert_key
              ? <a className="btn btn-line btn-sm" href={`/api/admin/wholesale-cert?key=${encodeURIComponent(detail.cert_key)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex' }}>🧾 사업자등록증 열람</a>
              : <span style={{ fontSize: 12, color: 'var(--muted)' }}>등록증 파일 없음</span>}
            <div className="modal-acts" style={{ marginTop: 14 }}>
              {detail.status !== 'approved' && <button className="btn btn-green btn-sm" onClick={() => setStatus(detail, 'approved')}>승인</button>}
              {detail.status !== 'rejected' && <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => setStatus(detail, 'rejected')}>반려</button>}
              <button className="btn btn-line btn-sm" onClick={() => setDetail(null)}>닫기</button>
            </div>
            {detail.status === 'approved' && (
              <div className="modal-acts" style={{ marginTop: 8, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', marginRight: 'auto' }}>여신(세금계산서):</span>
                {detail.credit_status !== 'approved' && <button className="btn btn-green btn-sm" onClick={() => setCredit(detail, 'approved')}>여신 승인</button>}
                {detail.credit_status === 'approved' && <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => setCredit(detail, 'rejected')}>여신 해제</button>}
                {detail.credit_status === 'pending' && <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => setCredit(detail, 'rejected')}>여신 반려</button>}
              </div>
            )}
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
