'use client';
import { useEffect, useState } from 'react';
import { list, create, update, remove } from '@/lib/adminApi';
import { won, dt } from '@/lib/format';
import ImageUploader from '@/components/admin/ImageUploader';

const THEMES = [{ v: 'green', l: '딥그린' }, { v: 'cream', l: '크림' }, { v: 'berry', l: '베리' }];
const EMPTY = { slug: '', title: '', subtitle: '', badge: '', theme: 'green', hero_image: '', description: '', is_active: true, starts_at: '', ends_at: '', sort_order: 0 };

export default function AdminEvents() {
  const [rows, setRows] = useState(null);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // 이벤트 편집 대상 (null=닫힘, {}=신규)
  const [form, setForm] = useState(EMPTY);
  const [items, setItems] = useState([]); // 편성 상품 [{pk?, product_pk, special_price, ...}]
  const [toast, setToast] = useState('');

  const load = () => list('event').then(setRows).catch((e) => say(e.message));
  useEffect(() => {
    load();
    list('product').then((ps) => setProducts(ps || [])).catch(() => {});
  }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function openEdit(ev) {
    if (ev) {
      setForm({ ...EMPTY, ...ev, starts_at: ev.starts_at || '', ends_at: ev.ends_at || '', hero_image: ev.hero_image || '' });
      const eps = await list('event_product').catch(() => []);
      setItems((eps || []).filter((x) => x.event_pk === ev.pk).sort((a, b) => a.sort_order - b.sort_order));
    } else {
      setForm(EMPTY);
      setItems([]);
    }
    setEditing(ev || {});
  }

  async function save() {
    if (!form.slug.trim() || !form.title.trim()) { say('URL 키(slug)와 제목은 필수예요'); return; }
    const body = {
      slug: form.slug.trim(), title: form.title, subtitle: form.subtitle, badge: form.badge,
      theme: form.theme, hero_image: form.hero_image || null, description: form.description,
      is_active: !!form.is_active, sort_order: Number(form.sort_order || 0),
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
    };
    try {
      let eventPk = editing.pk;
      if (eventPk) await update('event', eventPk, body);
      else { const j = await create('event', body); eventPk = j.row.pk; }

      // 편성 상품 동기화
      const keep = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.product_pk) continue;
        const ib = { event_pk: eventPk, product_pk: Number(it.product_pk), special_price: it.special_price === '' || it.special_price == null ? null : Number(it.special_price), sort_order: i };
        if (it.pk) { await update('event_product', it.pk, ib); keep.push(it.pk); }
        else { const j = await create('event_product', ib); keep.push(j.row.pk); }
      }
      const original = editing.pk ? (await list('event_product').catch(() => [])).filter((x) => x.event_pk === eventPk) : [];
      for (const old of original) { if (!keep.includes(old.pk)) await remove('event_product', old.pk); }

      setEditing(null); say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }

  async function del(pk) {
    if (!confirm('이벤트를 삭제할까요? 편성 상품도 함께 삭제됩니다.')) return;
    try { await remove('event', pk); say('삭제했어요'); load(); } catch (e) { say(e.message); }
  }
  async function toggle(ev) {
    try { await update('event', ev.pk, { is_active: !ev.is_active }); load(); } catch (e) { say(e.message); }
  }

  return (
    <>
      <div className="adm-head">
        <div><h1>특가·이벤트</h1><span className="sub">EVENTS</span></div>
        <div className="right"><button className="btn btn-green btn-sm" onClick={() => openEdit(null)}>+ 이벤트 추가</button></div>
      </div>
      <p className="sectit">추석 선물세트 등 기획전을 만들고 상품을 <b>특가로 편성</b>하세요. 활성 이벤트는 홈 "진행 중인 특가"와 <code>/event/&lt;slug&gt;</code> 페이지에 노출됩니다.</p>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>제목</th><th>URL(slug)</th><th>배지</th><th>기간</th><th>노출</th><th>관리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {(rows || []).map((ev) => (
              <tr key={ev.pk}>
                <td style={{ fontWeight: 700 }}>{ev.title}</td>
                <td>/event/{ev.slug}</td>
                <td>{ev.badge || '-'}</td>
                <td style={{ fontSize: 12 }}>{ev.starts_at || '상시'} ~ {ev.ends_at || ''}</td>
                <td><div className={`switch ${ev.is_active ? 'on' : ''}`} onClick={() => toggle(ev)}><i /></div></td>
                <td>
                  <button className="btn btn-line btn-sm" onClick={() => openEdit(ev)}>수정</button>{' '}
                  <a className="btn btn-line btn-sm" href={`/event/${ev.slug}`} target="_blank" rel="noreferrer">보기</a>{' '}
                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(ev.pk)}>삭제</button>
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>이벤트가 없어요</td></tr>}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <h3>{editing.pk ? '이벤트 수정' : '이벤트 추가'}</h3>
            <div className="row2">
              <div className="field"><label>제목 *</label><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="추석 선물 세트 특가" /></div>
              <div className="field"><label>URL 키(slug) *</label><input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="chuseok" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>부제</label><input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
              <div className="field"><label>배지 문구</label><input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="추석 한정 특가" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>기간 시작</label><input type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></div>
              <div className="field"><label>기간 종료</label><input type="date" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></div>
            </div>
            <div className="row2">
              <div className="field">
                <label>배경 테마</label>
                <select value={form.theme} onChange={(e) => set('theme', e.target.value)}>
                  {THEMES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div className="field"><label>정렬 순서</label><input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></div>
            </div>
            <ImageUploader label="히어로 이미지 (배너 배경)" value={form.hero_image || ''} onChange={(url) => set('hero_image', url)} tall />
            <div className="field"><label>설명</label><textarea rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '4px 0 6px' }}>
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ width: 'auto' }} /> 노출(활성)
            </label>

            <hr style={{ border: 'none', borderTop: '1px solid #E4EBE3', margin: '14px 0 10px' }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>편성 상품 (특가 비우면 기본가)</label>
            {items.map((it, i) => {
              const prod = products.find((p) => p.pk === Number(it.product_pk));
              return (
                <div key={i} style={{ display: 'flex', gap: 6, margin: '6px 0', alignItems: 'center' }}>
                  <select style={{ flex: 2, minWidth: 0 }} value={it.product_pk || ''} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, product_pk: e.target.value } : x))}>
                    <option value="">상품 선택</option>
                    {products.map((p) => <option key={p.pk} value={p.pk}>{p.emoji} {p.name}</option>)}
                  </select>
                  <input style={{ flex: 1, minWidth: 0 }} type="number" placeholder={prod ? `기본 ${won(prod.price)}` : '특가'} value={it.special_price ?? ''} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, special_price: e.target.value } : x))} />
                  <button className="btn btn-sm" style={{ color: 'var(--danger)', flex: 'none' }} onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
                </div>
              );
            })}
            <button className="btn btn-sm" style={{ border: '1px dashed var(--line)', width: '100%', marginTop: 4 }} onClick={() => setItems([...items, { product_pk: '', special_price: '' }])}>+ 상품 추가</button>

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
