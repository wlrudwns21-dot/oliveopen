'use client';
import { useEffect, useState } from 'react';
import { list, create, update, remove } from '@/lib/adminApi';
import { won } from '@/lib/format';

const EMPTY = {
  code: '', name: '', type: 'amount', value: 0, min_order: 0, issue_limit: '',
  until: '', is_active: true, target_grade: '', target_product_pk: '',
};
const GRADES = [{ v: '', l: '전체 등급' }, { v: 'GREEN', l: 'GREEN' }, { v: 'GOLD', l: 'GOLD' }, { v: 'VIP', l: 'VIP' }];

export default function AdminCoupons() {
  const [rows, setRows] = useState(null);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState('');

  const load = () => list('coupon').then(setRows).catch((e) => say(e.message));
  useEffect(() => {
    load();
    list('product').then((ps) => setProducts(ps || [])).catch(() => {});
  }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function open(row) {
    setForm(row ? {
      ...EMPTY, ...row,
      issue_limit: row.issue_limit ?? '', until: row.until ?? '',
      target_grade: row.target_grade ?? '', target_product_pk: row.target_product_pk ?? '',
    } : EMPTY);
    setEditing(row || {});
  }

  async function save() {
    if (!form.code.trim() || !form.name.trim()) { say('코드와 이름은 필수예요'); return; }
    const body = {
      code: form.code.trim(), name: form.name.trim(), type: form.type,
      value: Number(form.value || 0), min_order: Number(form.min_order || 0),
      issue_limit: form.issue_limit === '' ? null : Number(form.issue_limit),
      until: form.until || null, is_active: !!form.is_active,
      target_grade: form.target_grade || null,
      target_product_pk: form.target_product_pk === '' ? null : Number(form.target_product_pk),
    };
    try {
      if (editing.pk) await update('coupon', editing.pk, body);
      else await create('coupon', body);
      setEditing(null); say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }

  async function toggle(c) {
    try { await update('coupon', c.pk, { is_active: !c.is_active }); load(); }
    catch (e) { say(e.message); }
  }
  async function del(pk) {
    if (!confirm('쿠폰을 삭제할까요?')) return;
    try { await remove('coupon', pk); say('삭제했어요'); load(); } catch (e) { say(e.message); }
  }

  const filtered = (rows || []).filter((c) => !q.trim() || c.code.includes(q.trim()) || c.name.includes(q.trim()));
  const cond = (c) => {
    const parts = [];
    if (c.min_order) parts.push(`${won(c.min_order)}원↑`);
    if (c.target_grade) parts.push(`${c.target_grade} 전용`);
    if (c.product?.name) parts.push(`${c.product.name} 구매`);
    return parts.length ? parts.join(' · ') : '조건 없음';
  };

  return (
    <>
      <div className="adm-head">
        <div><h1>쿠폰·프로모션</h1><span className="sub">COUPONS</span></div>
        <div className="right"><button className="btn btn-green btn-sm" onClick={() => open(null)}>+ 쿠폰 추가</button></div>
      </div>
      <div className="adm-toolbar"><input type="search" placeholder="코드·이름 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>코드</th><th>이름</th><th>혜택</th><th>적용 조건</th><th>사용/발급</th><th>종료일</th><th>활성</th><th>관리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {filtered.map((c) => (
              <tr key={c.pk}>
                <td style={{ fontWeight: 700 }}>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.type === 'percent' ? `${c.value}%` : `${won(c.value)}원`}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{cond(c)}</td>
                <td>{c.used_count} / {c.issue_limit ?? '∞'}</td>
                <td>{c.until || '-'}</td>
                <td><div className={`switch ${c.is_active ? 'on' : ''}`} onClick={() => toggle(c)}><i /></div></td>
                <td>
                  <button className="btn btn-line btn-sm" onClick={() => open(c)}>수정</button>{' '}
                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(c.pk)}>삭제</button>
                </td>
              </tr>
            ))}
            {rows && !filtered.length && <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>쿠폰이 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal">
            <h3>{editing.pk ? '쿠폰 수정' : '쿠폰 추가'}</h3>
            <div className="row2">
              <div className="field"><label>쿠폰 코드 *</label><input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="WELCOME10" /></div>
              <div className="field"><label>이름 *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="신규가입 할인" /></div>
            </div>
            <div className="row2">
              <div className="field">
                <label>할인 방식</label>
                <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="amount">금액 할인(원)</option>
                  <option value="percent">% 할인</option>
                </select>
              </div>
              <div className="field"><label>할인값 {form.type === 'percent' ? '(%)' : '(원)'}</label><input type="number" value={form.value} onChange={(e) => set('value', e.target.value)} /></div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E4EBE3', margin: '16px 0 12px' }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 10 }}>적용 조건 (비우면 전체 적용)</label>
            <div className="row2">
              <div className="field"><label>최소 주문금액 (원)</label><input type="number" value={form.min_order} onChange={(e) => set('min_order', e.target.value)} placeholder="0" /></div>
              <div className="field">
                <label>대상 회원등급</label>
                <select value={form.target_grade} onChange={(e) => set('target_grade', e.target.value)}>
                  {GRADES.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>특정 상품 구매 시 (장바구니에 있어야 적용)</label>
              <select value={form.target_product_pk} onChange={(e) => set('target_product_pk', e.target.value)}>
                <option value="">전체 상품</option>
                {products.map((p) => <option key={p.pk} value={p.pk}>{p.emoji} {p.name}</option>)}
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E4EBE3', margin: '16px 0 12px' }} />
            <div className="row2">
              <div className="field"><label>발급 한도 (비우면 무제한)</label><input type="number" value={form.issue_limit} onChange={(e) => set('issue_limit', e.target.value)} /></div>
              <div className="field"><label>종료일 (YYYY-MM-DD)</label><input value={form.until} onChange={(e) => set('until', e.target.value)} placeholder="2026-12-31" /></div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ width: 'auto' }} /> 활성
            </label>

            <div className="modal-acts">
              <button className="btn btn-line btn-sm" onClick={() => setEditing(null)}>취소</button>
              <button className="btn btn-green btn-sm" onClick={save}>저장</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
