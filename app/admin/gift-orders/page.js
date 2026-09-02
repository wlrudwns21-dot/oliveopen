'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { won, dt } from '@/lib/format';

const STATUSES = [
  { v: 'pending', l: '접수', c: 'st-orange' },
  { v: 'confirmed', l: '확인', c: 'st-blue' },
  { v: 'shipped', l: '배송중', c: 'st-green' },
  { v: 'done', l: '완료', c: 'st-gray' },
  { v: 'canceled', l: '취소', c: 'st-red' },
];
const stInfo = (v) => STATUSES.find((s) => s.v === v) || STATUSES[0];

export default function AdminGiftOrders() {
  const [rows, setRows] = useState(null);
  const [seg, setSeg] = useState('all');
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => list('gift_order').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const filtered = (rows || []).filter((r) => seg === 'all' || r.status === seg);

  async function setStatus(r, status) {
    try { await update('gift_order', r.pk, { status }); load(); } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><div><h1>추석 선물 신청</h1><span className="sub">CHUSEOK GIFT ORDERS</span></div></div>
      <div className="adm-toolbar">
        <div className="seg">
          <button className={seg === 'all' ? 'on' : ''} onClick={() => setSeg('all')}>전체</button>
          {STATUSES.map((s) => <button key={s.v} className={seg === s.v ? 'on' : ''} onClick={() => setSeg(s.v)}>{s.l}</button>)}
        </div>
      </div>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>번호</th><th>상품</th><th>받는 분</th><th>연락처</th><th>배송지</th><th>희망일</th><th>상태</th><th>접수일</th><th></th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {filtered.map((r) => (
              <tr key={r.pk}>
                <td>{r.pk}</td>
                <td style={{ fontWeight: 700 }}>{r.product_name} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 11 }}>{won(r.product_price)}원</span></td>
                <td>{r.recipient_name}</td>
                <td>{r.recipient_phone}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.address} {r.detail_address || ''}</td>
                <td>{r.delivery_date || '-'}</td>
                <td>
                  <select value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
                    {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </td>
                <td>{dt(r.created_at)}</td>
                <td><button className="btn btn-line btn-sm" onClick={() => setDetail(r)}>상세</button></td>
              </tr>
            ))}
            {rows && !filtered.length && <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>신청이 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal">
            <h3>선물 신청 #{detail.pk}</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.9 }}>
              <b>상품</b> {detail.product_name} · {won(detail.product_price)}원<br />
              <b>신청자</b> {detail.orderer_name || '-'} · {detail.orderer_phone || '-'} {detail.member?.id ? `(회원 ${detail.member.id})` : '(비회원)'}<br />
              <b>받는 분</b> {detail.recipient_name} · {detail.recipient_phone}<br />
              <b>배송지</b> {detail.address} {detail.detail_address || ''} {detail.zipcode ? `(${detail.zipcode})` : ''}<br />
              <b>희망일</b> {detail.delivery_date || '협의'}<br />
              <b>요청</b> {detail.memo || '-'}<br />
              <b>상태</b> <span className={`status-pill ${stInfo(detail.status).c}`}>{stInfo(detail.status).l}</span> · 접수 {dt(detail.created_at)}
            </p>
            <div className="modal-acts">
              <button className="btn btn-green btn-sm" onClick={() => setDetail(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
