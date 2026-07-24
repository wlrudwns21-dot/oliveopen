'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { dt } from '@/lib/format';

const ST = { pending: { t: '승인 대기', c: 'st-orange' }, approved: { t: '승인됨', c: 'st-green' }, rejected: { t: '거절', c: 'st-red' } };
const ROLE_LABEL = { master: '마스터', manager: '관리자', operator: '운영자' };

export default function AdminAdmins() {
  const [rows, setRows] = useState(null);
  const [toast, setToast] = useState('');
  const load = () => list('admin_request').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  async function approve(r, role) {
    try {
      await update('admin_request', r.pk, { status: 'approved', requested_role: role, approved_at: new Date().toISOString(), approved_by: 'master' });
      say('승인했어요'); load();
    } catch (e) { say(e.message); }
  }
  async function reject(r) {
    if (!confirm('이 어드민 신청을 거절할까요?')) return;
    try { await update('admin_request', r.pk, { status: 'rejected' }); say('거절했어요'); load(); } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><div><h1>어드민 승인</h1><span className="sub">ADMIN APPROVAL</span></div></div>
      <p className="sectit">어드민 신청자를 <b>승인</b>하고 역할(관리자/운영자)을 지정하세요. 승인 시 해당 권한 그룹이 부여됩니다. 마스터 권한은 신청으로 부여되지 않습니다.</p>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>이름</th><th>아이디</th><th>희망 역할</th><th>상태</th><th>신청일</th><th>처리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {(rows || []).map((r) => (
              <tr key={r.pk}>
                <td style={{ fontWeight: 700 }}>{r.name}</td>
                <td>{r.member?.id}</td>
                <td>{ROLE_LABEL[r.requested_role] || r.requested_role}</td>
                <td><span className={`status-pill ${(ST[r.status] || ST.pending).c}`}>{(ST[r.status] || ST.pending).t}</span></td>
                <td>{dt(r.created_at)}</td>
                <td>
                  {r.status !== 'approved' ? (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button className="btn btn-green btn-sm" onClick={() => approve(r, 'manager')}>관리자 승인</button>
                      <button className="btn btn-green btn-sm" onClick={() => approve(r, 'operator')}>운영자 승인</button>
                      {r.status === 'pending' && <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => reject(r)}>거절</button>}
                    </div>
                  ) : (
                    <button className="btn btn-line btn-sm" onClick={() => reject(r)}>권한 회수</button>
                  )}
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>어드민 신청이 없어요</td></tr>}
          </tbody>
        </table>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
