'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { dt } from '@/lib/format';

const ST = { pending: { t: '승인 대기', c: 'st-orange' }, approved: { t: '승인됨', c: 'st-green' }, rejected: { t: '거절', c: 'st-red' } };

export default function AdminPartners() {
  const [rows, setRows] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [approve, setApprove] = useState(null); // 승인 대상
  const [code, setCode] = useState('');
  const [toast, setToast] = useState('');

  const load = () => list('partner').then(setRows).catch((e) => say(e.message));
  useEffect(() => {
    load();
    list('coupon').then((cs) => setCoupons((cs || []).filter((c) => c.is_referral))).catch(() => {});
  }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  async function doApprove() {
    if (!code.trim()) { say('추천인 코드를 선택/입력해 주세요'); return; }
    try {
      await update('partner', approve.pk, { status: 'approved', referral_code: code.trim(), approved_at: new Date().toISOString(), approved_by: 'master' });
      setApprove(null); say('승인했어요'); load();
    } catch (e) { say(e.message); }
  }
  async function reject(p) {
    if (!confirm('이 파트너 신청을 거절할까요?')) return;
    try { await update('partner', p.pk, { status: 'rejected' }); say('거절했어요'); load(); } catch (e) { say(e.message); }
  }
  async function setCodeFor(p) { setApprove(p); setCode(p.referral_code || ''); }

  return (
    <>
      <div className="adm-head"><div><h1>파트너 관리</h1><span className="sub">PARTNERS</span></div></div>
      <p className="sectit">파트너가 신청하면 여기서 <b>승인</b>하고 <b>추천인 코드</b>를 배정하세요. 승인된 파트너는 로그인 시 <b>배정된 코드에 매핑된 고객·매출만</b> 볼 수 있어요.</p>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>파트너</th><th>아이디</th><th>연락처</th><th>상태</th><th>추천 코드</th><th>신청일</th><th>처리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {(rows || []).map((p) => (
              <tr key={p.pk}>
                <td style={{ fontWeight: 700 }}>{p.company}</td>
                <td>{p.member?.id}</td>
                <td>{p.contact || '-'}</td>
                <td><span className={`status-pill ${(ST[p.status] || ST.pending).c}`}>{(ST[p.status] || ST.pending).t}</span></td>
                <td>{p.referral_code ? <b>{p.referral_code}</b> : <span style={{ color: '#c2cabb' }}>미배정</span>}</td>
                <td>{dt(p.created_at)}</td>
                <td>
                  {p.status === 'pending' && (
                    <>
                      <button className="btn btn-green btn-sm" onClick={() => setCodeFor(p)}>승인·코드배정</button>{' '}
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => reject(p)}>거절</button>
                    </>
                  )}
                  {p.status === 'approved' && <button className="btn btn-line btn-sm" onClick={() => setCodeFor(p)}>코드 변경</button>}
                  {p.status === 'rejected' && <button className="btn btn-line btn-sm" onClick={() => setCodeFor(p)}>재승인</button>}
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>파트너 신청이 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {approve && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setApprove(null); }}>
          <div className="modal">
            <h3>파트너 승인 · {approve.company}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>이 파트너에게 매핑할 <b>추천인 코드</b>를 지정하세요. 이 코드로 가입/구매한 고객만 파트너가 조회할 수 있어요.</p>
            <div className="field">
              <label>추천 쿠폰에서 선택</label>
              <select value={coupons.some((c) => c.code === code) ? code : ''} onChange={(e) => setCode(e.target.value)}>
                <option value="">직접 입력 ↓</option>
                {coupons.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}{c.referrer ? ` (${c.referrer})` : ''}</option>)}
              </select>
            </div>
            <div className="field">
              <label>추천인 코드 (직접 입력 가능)</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: OLIVE-KIM" />
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>※ 아직 추천 쿠폰이 없다면, 쿠폰·프로모션에서 "추천인 코드로 사용"을 켠 쿠폰을 먼저 만들어 그 코드를 쓰면 고객 가입/구매와 연결됩니다.</p>
            <div className="modal-acts">
              <button className="btn btn-line btn-sm" onClick={() => setApprove(null)}>취소</button>
              <button className="btn btn-green btn-sm" onClick={doApprove}>승인 및 배정</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
