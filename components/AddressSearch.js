'use client';
import { useState } from 'react';

/** 도로명주소 검색 바텀시트 (pg-app 안에서 사용)
 *  onSelect({ zipcode, address }) — 선택 시 호출
 *  onClose() — 닫기
 */
export default function AddressSearch({ onSelect, onClose }) {
  const [kw, setKw] = useState('');
  const [results, setResults] = useState(null);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function search(e) {
    e?.preventDefault();
    if (!kw.trim()) return;
    setBusy(true); setErr(''); setResults(null);
    try {
      const res = await fetch(`/api/address-search?keyword=${encodeURIComponent(kw.trim())}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || '검색에 실패했어요');
      setResults(j.results || []);
      setTotal(j.totalCount || 0);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '90%' }}>
        <h3>주소 검색</h3>
        <form onSubmit={search} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            autoFocus
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="도로명·지번·건물명 (예: 가락시장로 100)"
            style={{ flex: 1, minWidth: 0, border: '1.5px solid var(--line)', borderRadius: 11, padding: '11px 12px', outline: 'none' }}
          />
          <button type="submit" className="btn btn-green btn-sm" disabled={busy} style={{ flex: 'none' }}>
            {busy ? '검색중…' : '검색'}
          </button>
        </form>

        {err && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 8 }}>{err}</p>}

        {results && (
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8 }}>
            {results.length ? `검색 결과 ${total}건` : '검색 결과가 없어요. 도로명·건물명으로 다시 검색해 보세요.'}
          </div>
        )}

        {(results || []).map((r, i) => (
          <button
            key={i}
            onClick={() => onSelect({ zipcode: r.zipcode, address: r.road })}
            style={{
              display: 'block', width: '100%', textAlign: 'left', border: '1px solid var(--line)',
              borderRadius: 11, padding: '11px 13px', marginBottom: 8, background: '#fff',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-ink)', lineHeight: 1.4 }}>{r.road}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
              <span style={{ fontWeight: 700, color: 'var(--green2)' }}>우 {r.zipcode}</span> · {r.jibun}
            </div>
          </button>
        ))}

        {!results && !busy && (
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, padding: '8px 2px' }}>
            도로명, 지번, 건물명으로 검색할 수 있어요.<br />예) 가락시장로 100 · 송파구 신천동 · 롯데월드타워
          </p>
        )}
      </div>
    </>
  );
}
