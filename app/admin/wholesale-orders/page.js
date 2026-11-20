'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { won, dt } from '@/lib/format';

const STATUSES = [
  { v: 'pending', l: '접수' }, { v: 'confirmed', l: '확인' }, { v: 'shipped', l: '배송중' },
  { v: 'done', l: '완료' }, { v: 'canceled', l: '취소' },
];

export default function AdminWholesaleOrders() {
  const [rows, setRows] = useState(null);
  const [seg, setSeg] = useState('all');
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const load = () => list('wholesale_order').then((r) => setRows((r || []).sort((a, b) => b.pk - a.pk))).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);

  const filtered = (rows || []).filter((r) => seg === 'all' || r.status === seg);
  async function setStatus(r, status) { try { await update('wholesale_order', r.pk, { status }); load(); } catch (e) { say(e.message); } }

  return (
    <>
      <div className="adm-head"><div><h1>도매 주문</h1><span className="sub">WHOLESALE ORDERS</span></div></div>
      <div className="adm-toolbar"><div className="seg">
        <button className={seg === 'all' ? 'on' : ''} onClick={() => setSeg('all')}>전체</button>
        {STATUSES.map((s) => <button key={s.v} className={seg === s.v ? 'on' : ''} onClick={() => setSeg(s.v)}>{s.l}</button>)}
      </div></div>

      <div className="panel"><table className="atable">
        <thead><tr><th>주문번호</th><th>업체</th><th>박스</th><th>배송지</th><th>금액</th><th>상태</th><th>접수일</th><th></th></tr></thead>
        <tbody>
          {rows === null && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
          {filtered.map((r) => (
            <tr key={r.pk}>
              <td style={{ fontWeight: 700 }}>{r.order_no}</td>
              <td>{r.member?.nick || r.member?.id || '-'}</td>
              <td>{r.box_total}박스</td>
              <td>{(r.item || []).length}곳</td>
              <td style={{ fontWeight: 700 }}>{won(r.total)}원</td>
              <td>
                <select value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
                  {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </td>
              <td>{dt(r.created_at)}</td>
              <td><button className="btn btn-line btn-sm" onClick={() => setDetail(r)}>상세</button></td>
            </tr>
          ))}
          {rows && !filtered.length && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>주문이 없어요</td></tr>}
        </tbody>
      </table></div>

      {detail && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <h3>도매주문 {detail.order_no}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
              {detail.member?.nick || detail.member?.id} · {detail.box_total}박스 · {won(detail.total)}원 · {dt(detail.created_at)}<br />
              결제: <b style={{ color: detail.payment_method === 'tax_invoice' ? '#1f7a3d' : 'inherit' }}>{detail.payment_method === 'tax_invoice' ? '🧾 세금계산서(후불)' : '💳 일반 결제'}</b>
              {detail.manager_name ? <> · 담당자 {detail.manager_name}</> : null}
              {detail.note ? <><br />메모: {detail.note}</> : null}
            </p>
            <table className="atable" style={{ fontSize: 12.5 }}>
              <thead><tr><th>상품</th><th>박스</th><th>받는분</th><th>배송지</th><th>희망일</th></tr></thead>
              <tbody>
                {(detail.item || []).map((it) => (
                  <tr key={it.pk}>
                    <td>{it.product_name}{it.box_label ? ` (${it.box_label})` : ''}</td>
                    <td>{it.box_qty}박스<br /><span style={{ color: 'var(--muted)' }}>{won(it.line_total)}원</span></td>
                    <td>{it.recipient_name}<br />{it.recipient_phone}</td>
                    <td>{it.address} {it.detail_address || ''}</td>
                    <td>{it.delivery_date || '-'}{it.memo ? <><br /><span style={{ color: 'var(--muted)' }}>{it.memo}</span></> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-acts" style={{ marginTop: 14 }}><button className="btn btn-green btn-sm" onClick={() => setDetail(null)}>닫기</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
