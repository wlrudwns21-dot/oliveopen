'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MyHeader from '@/components/MyHeader';
import PhoneNav from '@/components/PhoneNav';
import Toaster, { toast } from '@/components/Toaster';
import { dt } from '@/lib/format';

const CATS = [
  { value: 'general', label: '일반 문의' },
  { value: 'order', label: '주문/결제' },
  { value: 'delivery', label: '배송' },
  { value: 'product', label: '상품' },
  { value: 'refund', label: '환불/교환' },
];
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.value, c.label]));
const ST = { open: { t: '접수', c: 'st-orange' }, answered: { t: '답변완료', c: 'st-green' }, closed: { t: '종료', c: 'st-gray' } };

export default function InquiryPage() {
  const router = useRouter();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'general', title: '', body: '' });

  async function load() {
    const res = await fetch('/api/inquiry');
    if (res.status === 401) { router.push('/login?next=/my/inquiry'); return; }
    const j = await res.json();
    setList(j.inquiries || []);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.title.trim()) { toast('제목을 입력해 주세요'); return; }
    const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setOpen(false); setForm({ category: 'general', title: '', body: '' }); toast('문의를 접수했어요'); load(); }
    else { const j = await res.json().catch(() => ({})); toast(j.error || '접수 실패'); }
  }

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <MyHeader title="1:1 문의" sub="SUPPORT" />
          <div style={{ padding: '14px 16px 0' }}>
            <button className="btn btn-green" style={{ width: '100%', marginBottom: 12 }} onClick={() => setOpen(true)}>+ 새 문의하기</button>

            {list === null && <div className="empty">불러오는 중…</div>}
            {list && !list.length && <div className="empty" style={{ padding: '40px 20px' }}>문의 내역이 없어요</div>}

            {(list || []).map((q) => (
              <div key={q.pk} className="infocard">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green2)', background: 'rgba(47,125,69,.1)', padding: '3px 8px', borderRadius: 6 }}>{CAT_LABEL[q.category] || q.category}</span>
                  <span className={`status-pill ${(ST[q.status] || ST.open).c}`}>{(ST[q.status] || ST.open).t}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)' }}>{dt(q.created_at)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8 }}>{q.title}</div>
                {q.body && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5, lineHeight: 1.55 }}>{q.body}</div>}
                {q.answer && (
                  <div style={{ marginTop: 10, background: 'var(--panel)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)' }}>💬 답변</div>
                    <div style={{ fontSize: 12.5, color: '#3a4434', marginTop: 4, lineHeight: 1.55 }}>{q.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ height: 20 }} />
        </div>

        {open && (
          <>
            <div className="sheet-scrim" onClick={() => setOpen(false)} />
            <div className="sheet">
              <h3>1:1 문의하기</h3>
              <div className="field">
                <label>분류</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="field"><label>제목 *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="무엇을 도와드릴까요?" /></div>
              <div className="field"><label>내용</label><textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="자세한 내용을 적어주세요" /></div>
              <button className="btn btn-green" style={{ width: '100%' }} onClick={submit}>문의 접수</button>
              <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>영업일 기준 1~2일 내 답변드려요</p>
            </div>
          </>
        )}
        <PhoneNav />
        <Toaster />
      </div>
    </div>
  );
}
