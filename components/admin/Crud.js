'use client';
import { useEffect, useMemo, useState } from 'react';
import { list, create, update, remove } from '@/lib/adminApi';

/** 제네릭 어드민 CRUD 테이블
 * columns: [{key, label, render(row)}]
 * fields:  [{key, label, type: 'text'|'number'|'textarea'|'select'|'checkbox'|'json', options, placeholder}]
 */
export default function Crud({ resource, title, columns, fields, searchKeys = [], canCreate = true, canDelete = true, refreshKey = 0 }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | {} | row
  const [toast, setToast] = useState('');

  const load = () => list(resource).then(setRows).catch((e) => setToast(e.message));
  useEffect(() => { load(); }, [resource, refreshKey]);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!q.trim() || !searchKeys.length) return rows;
    const t = q.trim().toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(t)));
  }, [rows, q]);

  async function save(form) {
    const body = {};
    for (const f of fields) {
      let v = form[f.key];
      if (f.type === 'number') v = v === '' || v == null ? null : Number(v);
      if (f.type === 'checkbox') v = !!v;
      if (f.type === 'json') {
        try { v = v ? JSON.parse(v) : null; }
        catch { say(`${f.label}: JSON 형식이 올바르지 않아요`); return; }
      }
      if (f.skipEmpty && (v === '' || v == null)) continue;
      body[f.key] = v;
    }
    try {
      if (editing?.pk) await update(resource, editing.pk, body);
      else await create(resource, body);
      setEditing(null);
      say('저장했어요');
      load();
    } catch (e) { say(e.message); }
  }

  async function del(pk) {
    if (!confirm('정말 삭제할까요?')) return;
    try { await remove(resource, pk); say('삭제했어요'); load(); }
    catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head">
        <h1>{title}</h1>
        <div className="adm-toolbar" style={{ marginBottom: 0 }}>
          {searchKeys.length > 0 && (
            <input type="search" placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} />
          )}
          {canCreate && <button className="btn btn-green btn-sm" onClick={() => setEditing({})}>+ 추가</button>}
        </div>
      </div>

      <div className="panel">
        <table className="atable">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th style={{ width: 110 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && <tr><td colSpan={columns.length + 1} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {filtered.map((r) => (
              <tr key={r.pk}>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(r, { update: (b) => update(resource, r.pk, b).then(load).catch((e) => say(e.message)) }) : String(r[c.key] ?? '')}</td>)}
                <td>
                  <button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={() => setEditing(r)}>수정</button>{' '}
                  {canDelete && <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(r.pk)}>삭제</button>}
                </td>
              </tr>
            ))}
            {rows && !filtered.length && <tr><td colSpan={columns.length + 1} style={{ color: 'var(--muted)' }}>데이터가 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <EditModal title={title} fields={fields} row={editing} onClose={() => setEditing(null)} onSave={save} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export function EditModal({ title, fields, row, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    const f = {};
    fields.forEach((fd) => {
      const v = row[fd.key];
      f[fd.key] = fd.type === 'json' ? (v == null ? (fd.placeholder || '') : JSON.stringify(v)) : (v ?? (fd.type === 'checkbox' ? true : ''));
    });
    return f;
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>{row.pk ? `${title} 수정 #${row.pk}` : `${title} 추가`}</h3>
        {fields.map((f) => (
          <div className="field" key={f.key}>
            {f.type !== 'checkbox' && <label>{f.label}</label>}
            {f.type === 'textarea' || f.type === 'json' ? (
              <textarea rows={3} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
            ) : f.type === 'select' ? (
              <select value={form[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === 'checkbox' ? (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(f.key, e.target.checked)} style={{ width: 'auto' }} />
                {f.label}
              </label>
            ) : (
              <input type={f.type === 'number' ? 'number' : 'text'} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
            )}
          </div>
        ))}
        <div className="modal-acts">
          <button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={onClose}>취소</button>
          <button className="btn btn-green btn-sm" onClick={() => onSave(form)}>저장</button>
        </div>
      </div>
    </div>
  );
}
