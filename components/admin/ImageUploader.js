'use client';
import { useRef, useState } from 'react';

/** 이미지 업로드 위젯.
 *  value: 현재 이미지 URL(없으면 '')
 *  onChange: 업로드 완료 시 새 URL 전달
 *  tall: 상세페이지처럼 세로로 긴 미리보기 여부
 */
export default function ImageUploader({ value, onChange, label, tall }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || '업로드 실패');
      onChange(j.url);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {value ? (
          <div style={{ position: 'relative' }}>
            <img
              src={value}
              alt=""
              style={{
                width: tall ? 160 : 88,
                maxHeight: tall ? 260 : 88,
                height: tall ? 'auto' : 88,
                objectFit: tall ? 'contain' : 'cover',
                borderRadius: 10, border: '1px solid #E4EBE3', background: '#f6f8f5', display: 'block',
              }}
            />
          </div>
        ) : (
          <div style={{
            width: tall ? 160 : 88, height: tall ? 120 : 88, borderRadius: 10,
            border: '1.5px dashed #cdd8cc', display: 'grid', placeItems: 'center',
            color: '#9aa08c', fontSize: 12, background: '#fafcf9',
          }}>이미지 없음</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? '업로드 중…' : value ? '이미지 변경' : '이미지 업로드'}
          </button>
          {value && (
            <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #E4EBE3' }} onClick={() => onChange('')}>
              제거
            </button>
          )}
        </div>
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 11.5, marginTop: 6 }}>{err}</p>}
    </div>
  );
}
