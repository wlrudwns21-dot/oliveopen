'use client';
import { useEffect, useState } from 'react';
import { list, create, update, remove } from '@/lib/adminApi';

export default function AdminSite() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // {pk?, config_key, config_value}
  const [toast, setToast] = useState('');

  const load = () => list('site_config').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const parse = (v) => { try { return JSON.parse(v); } catch { return null; } };
  const slides = (rows || [])
    .filter((r) => r.config_key.startsWith('main_slide/'))
    .map((r) => ({ row: r, data: parse(r.config_value) || {} }))
    .sort((a, b) => (a.data.sort_order || 0) - (b.data.sort_order || 0));
  const others = (rows || []).filter((r) => !r.config_key.startsWith('main_slide/'));

  async function toggleSlide(s) {
    const next = { ...s.data, active: s.data.active === false };
    try { await update('site_config', s.row.pk, { config_value: JSON.stringify(next) }); load(); }
    catch (e) { say(e.message); }
  }

  async function save() {
    if (!editing.config_key) { say('키를 입력해 주세요'); return; }
    if (editing.config_value?.trim().startsWith('{') && !parse(editing.config_value)) { say('JSON 형식이 올바르지 않아요'); return; }
    try {
      if (editing.pk) await update('site_config', editing.pk, { config_key: editing.config_key, config_value: editing.config_value });
      else await create('site_config', { config_key: editing.config_key, config_value: editing.config_value });
      setEditing(null); say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }

  async function del(pk) {
    if (!confirm('삭제할까요?')) return;
    try { await remove('site_config', pk); load(); } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head">
        <h1>홈 화면 편집</h1>
        <button
          className="btn btn-green btn-sm"
          onClick={() => setEditing({
            config_key: `main_slide/s${Date.now().toString(36)}`,
            config_value: JSON.stringify({ theme: 'green', eyebrow: '', title: '', desc: '', cta: '', link: '/', image: '', sort_order: slides.length, active: true }, null, 2),
          })}
        >+ 히어로 배너 추가</button>
      </div>

      <div className="panel">
        <h2>히어로 배너 ({slides.length})</h2>
        <table className="atable">
          <thead><tr><th>순서</th><th>테마</th><th>제목</th><th>링크</th><th>노출</th><th>관리</th></tr></thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s.row.pk}>
                <td>{s.data.sort_order ?? 0}</td>
                <td>{s.data.theme}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{s.data.title}</td>
                <td>{s.data.link}</td>
                <td><div className={`switch ${s.data.active !== false ? 'on' : ''}`} onClick={() => toggleSlide(s)}><i /></div></td>
                <td>
                  <button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={() => setEditing({ pk: s.row.pk, config_key: s.row.config_key, config_value: JSON.stringify(s.data, null, 2) })}>수정</button>{' '}
                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(s.row.pk)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>기타 설정</h2>
        <table className="atable">
          <thead><tr><th>키</th><th>값</th><th>관리</th></tr></thead>
          <tbody>
            {others.map((r) => (
              <tr key={r.pk}>
                <td>{r.config_key}</td>
                <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.config_value}</td>
                <td>
                  <button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={() => setEditing({ pk: r.pk, config_key: r.config_key, config_value: r.config_value })}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-sm" style={{ border: '1px dashed var(--line)', marginTop: 8 }} onClick={() => setEditing({ config_key: '', config_value: '' })}>+ 설정 추가</button>
      </div>

      {editing && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal">
            <h3>{editing.pk ? '설정 수정' : '설정 추가'}</h3>
            <div className="field"><label>config_key</label><input value={editing.config_key} onChange={(e) => setEditing({ ...editing, config_key: e.target.value })} /></div>
            <div className="field"><label>config_value</label><textarea rows={10} value={editing.config_value || ''} onChange={(e) => setEditing({ ...editing, config_value: e.target.value })} /></div>
            <div className="modal-acts">
              <button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={() => setEditing(null)}>취소</button>
              <button className="btn btn-green btn-sm" onClick={save}>저장</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
