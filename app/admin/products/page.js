'use client';
import { useEffect, useState } from 'react';
import { list, create, update, remove } from '@/lib/adminApi';
import { won } from '@/lib/format';
import ImageUploader from '@/components/admin/ImageUploader';

const EMPTY = { sku: '', name: '', emoji: '', origin: '', sub_title: '', description: '', price: 0, original_price: '', status: 'active', badges: '[]', is_md_pick: false, category_pk: 1, sort_order: 0 };

// product_image.storage_key(상대경로 또는 URL) → 화면에서 볼 수 있는 URL
function toUrl(key) {
  if (!key) return '';
  if (key.startsWith('http') || key.startsWith('/')) return key;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${key}`;
}

export default function AdminProducts() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [options, setOptions] = useState([]);
  const [thumb, setThumb] = useState({ url: '', pk: null });   // 대표(썸네일) 이미지
  const [detail, setDetail] = useState({ url: '', pk: null }); // 상세페이지 이미지
  const [toast, setToast] = useState('');

  const load = () => list('product').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function openEdit(p) {
    if (p) {
      setForm({ ...EMPTY, ...p, original_price: p.original_price ?? '', badges: JSON.stringify(p.badges || []) });
      setOptions((p.product_option || []).sort((a, b) => a.sort_order - b.sort_order).map((o) => ({ ...o })));
      const imgs = p.product_image || [];
      const t = imgs.find((i) => i.purpose === 'thumbnail');
      const d = imgs.find((i) => i.purpose === 'detail');
      setThumb({ url: toUrl(t?.storage_key), pk: t?.pk || null });
      setDetail({ url: toUrl(d?.storage_key), pk: d?.pk || null });
    } else {
      setForm(EMPTY);
      setOptions([{ label: '', price: 0, original_price: '', sort_order: 0 }]);
      setThumb({ url: '', pk: null });
      setDetail({ url: '', pk: null });
    }
    setEditing(p || {});
  }

  // 이미지 한 종류(썸네일/상세) 저장: 있으면 update, 없으면 insert, 지웠으면 delete
  async function syncImage(productPk, purpose, state) {
    if (state.url) {
      if (state.pk) await update('product_image', state.pk, { storage_key: state.url });
      else await create('product_image', { product_pk: productPk, storage_key: state.url, purpose, sort_order: 0 });
    } else if (state.pk) {
      await remove('product_image', state.pk);
    }
  }

  async function save() {
    if (!form.sku || !form.name) { say('SKU와 상품명은 필수예요'); return; }
    let badges;
    try { badges = JSON.parse(form.badges || '[]'); } catch { say('배지는 JSON 배열 형식이어야 해요'); return; }
    const validOpts = options.filter((o) => o.label);
    const first = validOpts[0];
    const body = {
      sku: form.sku, name: form.name, emoji: form.emoji, origin: form.origin,
      sub_title: form.sub_title, description: form.description,
      price: first ? Number(first.price) : Number(form.price || 0),
      original_price: first ? (first.original_price ? Number(first.original_price) : null) : (form.original_price ? Number(form.original_price) : null),
      status: form.status, badges, is_md_pick: !!form.is_md_pick,
      category_pk: Number(form.category_pk || 1), sort_order: Number(form.sort_order || 0),
    };
    try {
      let productPk = editing.pk;
      if (productPk) await update('product', productPk, body);
      else { const j = await create('product', body); productPk = j.row.pk; }

      // 옵션 동기화
      const keepPks = [];
      for (let i = 0; i < validOpts.length; i++) {
        const o = validOpts[i];
        const ob = { product_pk: productPk, label: o.label, price: Number(o.price || 0), original_price: o.original_price ? Number(o.original_price) : null, sort_order: i };
        if (o.pk) { await update('product_option', o.pk, ob); keepPks.push(o.pk); }
        else { const j = await create('product_option', ob); keepPks.push(j.row.pk); }
      }
      for (const old of editing.product_option || []) {
        if (!keepPks.includes(old.pk)) await remove('product_option', old.pk);
      }

      // 이미지 저장 (썸네일 + 상세페이지)
      await syncImage(productPk, 'thumbnail', thumb);
      await syncImage(productPk, 'detail', detail);

      setEditing(null); say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }

  async function del(pk) {
    if (!confirm('상품을 삭제할까요? 관련 옵션/이미지도 함께 삭제돼요.')) return;
    try { await remove('product', pk); say('삭제했어요'); load(); }
    catch (e) { say(e.message); }
  }

  const filtered = (rows || []).filter((p) => !q.trim() || p.name.includes(q.trim()) || p.sku.includes(q.trim()));

  return (
    <>
      <div className="adm-head">
        <h1>상품 관리</h1>
        <div className="adm-toolbar" style={{ marginBottom: 0 }}>
          <input type="search" placeholder="상품명·SKU 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-green btn-sm" onClick={() => openEdit(null)}>+ 상품 추가</button>
        </div>
      </div>

      <div className="panel">
        <table className="atable">
          <thead><tr><th>이미지</th><th>SKU</th><th>상품명</th><th>원산지</th><th>대표가</th><th>옵션</th><th>상태</th><th>MD픽</th><th>관리</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>불러오는 중…</td></tr>}
            {filtered.map((p) => {
              const thumb = (p.product_image || []).find((i) => i.purpose === 'thumbnail');
              return (
                <tr key={p.pk}>
                  <td>{thumb ? <img className="thumb" src={thumb.storage_key.startsWith('http') || thumb.storage_key.startsWith('/') ? thumb.storage_key : '/assets/logo-emblem.png'} alt="" /> : p.emoji}</td>
                  <td>{p.sku}</td>
                  <td>{p.emoji} {p.name}</td>
                  <td>{p.origin}</td>
                  <td>{won(p.price)}원</td>
                  <td>{(p.product_option || []).length}개</td>
                  <td>
                    <select value={p.status} onChange={async (e) => { try { await update('product', p.pk, { status: e.target.value }); load(); } catch (er) { say(er.message); } }}>
                      <option value="active">판매중</option>
                      <option value="soldout">품절</option>
                      <option value="hidden">숨김</option>
                    </select>
                  </td>
                  <td>
                    <div className={`switch ${p.is_md_pick ? 'on' : ''}`} onClick={async () => { try { await update('product', p.pk, { is_md_pick: !p.is_md_pick }); load(); } catch (er) { say(er.message); } }}><i /></div>
                  </td>
                  <td>
                    <button className="btn btn-sm" style={{ border: '1px solid var(--line)' }} onClick={() => openEdit(p)}>수정</button>{' '}
                    <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(p.pk)}>삭제</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal">
            <h3>{editing.pk ? `상품 수정 — ${editing.name}` : '상품 추가'}</h3>
            <div className="row2">
              <div className="field"><label>SKU (영문 키) *</label><input value={form.sku} onChange={(e) => set('sku', e.target.value)} /></div>
              <div className="field"><label>이모지</label><input value={form.emoji} onChange={(e) => set('emoji', e.target.value)} /></div>
            </div>
            <div className="field"><label>상품명 *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="row2">
              <div className="field"><label>원산지</label><input value={form.origin} onChange={(e) => set('origin', e.target.value)} /></div>
              <div className="field"><label>노출 순서</label><input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></div>
            </div>
            <div className="field"><label>한 줄 소개</label><input value={form.sub_title} onChange={(e) => set('sub_title', e.target.value)} /></div>
            <div className="field"><label>상세 설명</label><textarea rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="field"><label>배지 (JSON 배열)</label><input value={form.badges} onChange={(e) => set('badges', e.target.value)} placeholder='["새벽 경매 직송","산지직송"]' /></div>
            <div className="field">
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={!!form.is_md_pick} onChange={(e) => set('is_md_pick', e.target.checked)} style={{ width: 'auto' }} /> MD's Pick 노출
              </label>
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>옵션 (첫 옵션 가격이 대표가로 저장돼요)</label>
            {options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
                <input style={{ flex: 2 }} placeholder="옵션명" value={o.label} onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <input style={{ flex: 1 }} type="number" placeholder="판매가" value={o.price} onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                <input style={{ flex: 1 }} type="number" placeholder="정상가" value={o.original_price ?? ''} onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, original_price: e.target.value } : x))} />
                <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setOptions(options.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="btn btn-sm" style={{ border: '1px dashed var(--line)', width: '100%', marginTop: 4 }} onClick={() => setOptions([...options, { label: '', price: 0, original_price: '', sort_order: options.length }])}>+ 옵션 추가</button>

            <hr style={{ border: 'none', borderTop: '1px solid #E4EBE3', margin: '18px 0 14px' }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>상품 이미지</label>
            <div className="row2">
              <ImageUploader label="대표 이미지 (썸네일 · 정사각 권장)" value={thumb.url} onChange={(url) => setThumb((s) => ({ ...s, url }))} />
              <ImageUploader label="상세페이지 이미지 (세로로 긴 이미지)" value={detail.url} onChange={(url) => setDetail((s) => ({ ...s, url }))} tall />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 4px', lineHeight: 1.5 }}>
              · 상세페이지 이미지는 상품 상세 화면 "상세정보" 탭에 그대로 노출됩니다 (JPG/PNG · 10MB 이하)<br />
              · 여러 장을 하나로 이어붙인 세로 긴 이미지 1장을 올리는 방식이 가장 깔끔해요
            </p>

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
