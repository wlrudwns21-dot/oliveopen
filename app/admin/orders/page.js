'use client';
import { useEffect, useMemo, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { won, dt, ORDER_STATUS, PAY_STATUS } from '@/lib/format';

const STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'canceled', 'return_requested', 'return_completed'];
const SEGMENTS = [
  { key: 'all', label: '전체' },
  { key: 'confirmed', label: '결제완료' },
  { key: 'preparing', label: '상품준비' },
  { key: 'shipping', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'canceled', label: '취소/반품' },
];

export default function AdminOrders() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState('all');
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => list('orders').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const filtered = useMemo(() => {
    let r = rows || [];
    if (seg === 'canceled') r = r.filter((o) => ['canceled', 'cancelled', 'return_requested', 'return_completed', 'partial_canceled'].includes(o.status));
    else if (seg !== 'all') r = r.filter((o) => o.status === seg);
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((o) => (o.order_no || '').toLowerCase().includes(t) || (o.member?.nick || '').includes(q.trim()) || (o.receiver_name || '').includes(q.trim()));
    return r;
  }, [rows, q, seg]);

  async function setStatus(o, status) {
    try { await update('orders', o.pk, { status }); say('상태를 변경했어요'); load(); }
    catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><h1>주문 관리</h1></div>
      <div className="adm-toolbar">
        <input type="search" placeholder="주문번호·고객·수령인 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg">
          {SEGMENTS.map((s) => (
            <button key={s.key} className={seg === s.key ? 'on' : ''} onClick={() => setSeg(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>주문번호</th><th>고객</th><th>상품</th><th>금액</th><th>결제</th><th>상태</th><th>일시</th><th></th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {filtered.map((o) => (
              <tr key={o.pk}>
                <td>{o.order_no || `#${o.pk}`}</td>
                <td>{o.member?.nick || '-'}</td>
                <td>{(o.order_item || []).map((i) => `${i.product_name} ×${i.quantity}`).join(', ').slice(0, 40)}</td>
                <td>{won(o.total_amount)}원</td>
                <td>{o.payment?.[0] ? (PAY_STATUS[o.payment[0].status] || o.payment[0].status) : '-'}</td>
                <td>
                  <select value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS[s]}</option>)}
                  </select>
                </td>
                <td>{dt(o.created_at)}</td>
                <td><button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={() => setDetail(o)}>상세</button></td>
              </tr>
            ))}
            {rows && !filtered.length && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>주문이 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal">
            <h3>주문 상세 — {detail.order_no || `#${detail.pk}`}</h3>
            <p style={{ fontSize: 13, lineHeight: 1.8 }}>
              <b>고객</b> {detail.member?.nick} ({detail.member?.id})<br />
              <b>수령인</b> {detail.receiver_name} · {detail.receiver_phone}<br />
              <b>주소</b> {detail.address} {detail.detail_address}<br />
              <b>요청사항</b> {detail.delivery_request || '-'}<br />
              <b>결제수단</b> {detail.payment_method || '-'} / 배송비 {won(detail.shipping_fee)}원 / 할인 {won(detail.discount_amount)}원<br />
              <b>사용 쿠폰</b> {detail.coupon_code
                ? <span style={{ fontWeight: 700, color: 'var(--green)' }}>🎟️ {detail.coupon_code}</span>
                : '없음'}
            </p>
            <table className="atable" style={{ minWidth: 0, marginTop: 10 }}>
              <thead><tr><th>상품</th><th>옵션</th><th>수량</th><th>단가</th></tr></thead>
              <tbody>
                {(detail.order_item || []).map((i) => (
                  <tr key={i.pk}><td>{i.product_name}</td><td>{i.option_label || '-'}</td><td>{i.quantity}</td><td>{won(i.unit_price)}원</td></tr>
                ))}
              </tbody>
            </table>
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
