'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MyHeader from '@/components/MyHeader';
import PhoneNav from '@/components/PhoneNav';
import Toaster, { toast } from '@/components/Toaster';
import AddressSearch from '@/components/AddressSearch';

const EMPTY = { label: '우리집', recipient: '', phone: '', zipcode: '', address: '', detail_address: '', is_default: false };

export default function AddressesPage() {
  const router = useRouter();
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} | row
  const [form, setForm] = useState(EMPTY);
  const [searching, setSearching] = useState(false); // 주소 검색 시트

  async function load() {
    const res = await fetch('/api/addresses');
    if (res.status === 401) { router.push('/login?next=/my/addresses'); return; }
    const j = await res.json();
    setList(j.addresses || []);
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function open(row) {
    setForm(row ? { ...row } : { ...EMPTY, is_default: (list || []).length === 0 });
    setEditing(row || {});
  }

  async function save() {
    if (!form.recipient || !form.phone || !form.address) { toast('받는분·연락처·주소는 필수예요'); return; }
    const method = editing.pk ? 'PATCH' : 'POST';
    const res = await fetch('/api/addresses', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) { setEditing(null); toast('저장했어요'); load(); }
    else { const j = await res.json().catch(() => ({})); toast(j.error || '저장 실패'); }
  }

  async function setDefault(pk) {
    await fetch('/api/addresses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pk, is_default: true }) });
    load();
  }
  async function del(pk) {
    if (!confirm('이 배송지를 삭제할까요?')) return;
    await fetch('/api/addresses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pk }) });
    load();
  }

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <MyHeader title="배송지 관리" sub="ADDRESS BOOK" />
          <div style={{ padding: '14px 16px 0' }}>
            <button className="btn btn-green" style={{ width: '100%', marginBottom: 12 }} onClick={() => open(null)}>+ 새 배송지 추가</button>

            {list === null && <div className="empty">불러오는 중…</div>}
            {list && !list.length && <div className="empty" style={{ padding: '40px 20px' }}>등록된 배송지가 없어요</div>}

            {(list || []).map((a) => (
              <div key={a.pk} className="infocard">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ fontSize: 14, fontWeight: 800 }}>{a.recipient}</b>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', background: '#EEE7D8', padding: '3px 8px', borderRadius: 6 }}>{a.label}</span>
                  {a.is_default && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'var(--green2)', padding: '3px 8px', borderRadius: 6 }}>기본</span>}
                </div>
                <div style={{ fontSize: 12.5, color: '#4a5340', marginTop: 7, lineHeight: 1.55 }}>
                  {a.address} {a.detail_address}{a.zipcode ? ` (${a.zipcode})` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{a.phone}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  {!a.is_default && <button className="btn btn-line btn-sm" onClick={() => setDefault(a.pk)}>기본으로</button>}
                  <button className="btn btn-line btn-sm" onClick={() => open(a)}>수정</button>
                  <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--line)' }} onClick={() => del(a.pk)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 20 }} />
        </div>

        {editing !== null && (
          <>
            <div className="sheet-scrim" onClick={() => setEditing(null)} />
            <div className="sheet">
              <h3>{editing.pk ? '배송지 수정' : '새 배송지'}</h3>
              <div className="field"><label>배송지 이름</label><input value={form.label} onChange={set('label')} placeholder="우리집 / 회사" /></div>
              <div className="field"><label>받는 분 *</label><input value={form.recipient} onChange={set('recipient')} /></div>
              <div className="field"><label>연락처 *</label><input value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" /></div>
              <div className="field">
                <label>주소 *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.zipcode || ''} readOnly placeholder="우편번호" style={{ width: 96, flex: 'none', background: '#f6f8f5' }} />
                  <button type="button" className="btn btn-line btn-sm" style={{ flex: 'none' }} onClick={() => setSearching(true)}>주소 검색</button>
                </div>
                <input value={form.address} onChange={set('address')} placeholder="주소 검색으로 입력하세요" style={{ marginTop: 8 }} />
              </div>
              <div className="field"><label>상세주소</label><input value={form.detail_address || ''} onChange={set('detail_address')} placeholder="동/호수 등" /></div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '4px 0 12px' }}>
                <input type="checkbox" checked={!!form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} style={{ width: 'auto' }} />
                기본 배송지로 설정
              </label>
              <button className="btn btn-green" style={{ width: '100%' }} onClick={save}>저장</button>
            </div>
          </>
        )}

        {searching && (
          <AddressSearch
            onClose={() => setSearching(false)}
            onSelect={({ zipcode, address }) => {
              setForm((f) => ({ ...f, zipcode, address }));
              setSearching(false);
              toast('주소를 입력했어요. 상세주소를 마저 적어주세요');
            }}
          />
        )}
        <PhoneNav />
        <Toaster />
      </div>
    </div>
  );
}
