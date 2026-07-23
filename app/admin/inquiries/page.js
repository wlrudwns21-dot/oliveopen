'use client';
import { useEffect, useState } from 'react';
import { list, update } from '@/lib/adminApi';
import { dt } from '@/lib/format';

const CAT_LABEL = { general: '일반', order: '주문/결제', delivery: '배송', product: '상품', refund: '환불/교환' };
const ST = { open: { t: '접수', c: 'st-orange' }, answered: { t: '답변완료', c: 'st-green' }, closed: { t: '종료', c: 'st-gray' } };

export default function AdminInquiries() {
  const [rows, setRows] = useState(null);
  const [seg, setSeg] = useState('all');
  const [editing, setEditing] = useState(null);
  const [answer, setAnswer] = useState('');
  const [toast, setToast] = useState('');

  const load = () => list('inquiry').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const filtered = (rows || []).filter((r) => seg === 'all' || r.status === seg);

  async function saveAnswer(status) {
    try {
      await update('inquiry', editing.pk, { answer, status });
      setEditing(null); say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head"><div><h1>1:1 문의</h1><span className="sub">SUPPORT</span></div></div>
      <div className="adm-toolbar">
        <div className="seg">
          {[['all', '전체'], ['open', '접수'], ['answered', '답변완료'], ['closed', '종료']].map(([k, l]) => (
            <button key={k} className={seg === k ? 'on' : ''} onClick={() => setSeg(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>번호</th><th>고객</th><th>분류</th><th>제목</th><th>상태</th><th>접수일</th><th></th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {filtered.map((q) => (
              <tr key={q.pk}>
                <td>{q.pk}</td>
                <td>{q.member?.nick || '-'} <span style={{ color: 'var(--muted)', fontSize: 11 }}>({q.member?.id})</span></td>
                <td>{CAT_LABEL[q.category] || q.category}</td>
                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</td>
                <td><span className={`status-pill ${(ST[q.status] || ST.open).c}`}>{(ST[q.status] || ST.open).t}</span></td>
                <td>{dt(q.created_at)}</td>
                <td><button className="btn btn-line btn-sm" onClick={() => { setEditing(q); setAnswer(q.answer || ''); }}>{q.answer ? '답변 보기' : '답변하기'}</button></td>
              </tr>
            ))}
            {rows && !filtered.length && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>문의가 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal">
            <h3>문의 #{editing.pk} · {editing.member?.nick}</h3>
            <div style={{ background: '#f6f8f5', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>[{CAT_LABEL[editing.category] || editing.category}] · {dt(editing.created_at)}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green-ink)' }}>{editing.title}</div>
              {editing.body && <div style={{ fontSize: 13, color: '#3a4434', marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{editing.body}</div>}
            </div>
            <div className="field">
              <label>답변</label>
              <textarea rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="고객에게 전달할 답변을 입력하세요" />
            </div>
            <div className="modal-acts">
              <button className="btn btn-line btn-sm" onClick={() => setEditing(null)}>닫기</button>
              <button className="btn btn-line btn-sm" onClick={() => saveAnswer('closed')}>종료 처리</button>
              <button className="btn btn-green btn-sm" onClick={() => saveAnswer('answered')}>답변 등록</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
