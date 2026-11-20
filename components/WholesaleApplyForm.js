'use client';
import { useRef, useState } from 'react';
import Toaster, { toast } from './Toaster';
import AddressSearch from './AddressSearch';

export default function WholesaleApplyForm({ loggedIn, existing }) {
  const [form, setForm] = useState({
    id: '', password: '', company_name: '', business_no: '', owner_name: '',
    contact_phone: '', contact_email: '', zipcode: '', address: '', detail_address: '',
    cert_key: '', cert_preview: '',
  });
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // 이미 신청/승인된 상태면 안내만
  if (existing) {
    const map = { pending: ['⏳', '승인 대기 중이에요', '제출하신 사업자등록증을 담당자가 확인하고 있어요. 승인되면 도매 주문이 가능해집니다.'],
      approved: ['✅', '승인된 도매 회원이에요', '도매 전용관에서 박스 단위로 주문하실 수 있어요.'],
      rejected: ['❌', '신청이 반려됐어요', existing.reject_reason || '서류를 다시 확인해 주세요. 재신청은 고객센터로 문의 바랍니다.'] };
    const [ic, tt, ds] = map[existing.status] || map.pending;
    return (
      <div className="stage"><div className="phone pg-app"><div className="view">
        <div style={{ textAlign: 'center', padding: '56px 28px' }}>
          <div style={{ fontSize: 54 }}>{ic}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 8px' }}>{tt}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>{ds}</p>
          {existing.status === 'approved' && <a href="/wholesale" className="authbtn" style={{ display: 'flex', justifyContent: 'center', marginTop: 22, textDecoration: 'none' }}>도매 주문하러 가기</a>}
        </div>
      </div></div></div>
    );
  }

  async function uploadCert(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/wholesale/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setForm((f) => ({ ...f, cert_key: j.key, cert_preview: j.preview || '' }));
      toast('사업자등록증이 첨부됐어요');
    } catch (x) { toast(x.message || '업로드 실패'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.company_name || form.business_no.replace(/[^0-9]/g, '').length !== 10) { toast('상호·사업자등록번호(10자리)를 확인해 주세요'); return; }
    if (!form.cert_key) { toast('사업자등록증을 업로드해 주세요'); return; }
    if (!loggedIn && (!form.id || form.password.length < 8)) { toast('아이디·비밀번호(8자+)를 입력해 주세요'); return; }
    setBusy(true);
    const res = await fetch('/api/wholesale/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone(true); else toast(j.error || '신청에 실패했어요');
  }

  if (done) {
    return (
      <div className="stage"><div className="phone pg-app"><div className="view">
        <div style={{ textAlign: 'center', padding: '56px 28px' }}>
          <div style={{ fontSize: 54 }}>🧾</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 8px' }}>도매 신청이 접수됐어요</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            담당자가 사업자등록증을 확인한 뒤 <b style={{ color: 'var(--green-ink)' }}>승인</b>해 드려요.<br />
            {loggedIn ? '승인되면 도매 주문이 열립니다.' : '승인 후 방금 만든 아이디로 로그인하시면 도매 주문이 가능해요.'}
          </p>
          <a href="/" className="authbtn" style={{ display: 'flex', justifyContent: 'center', marginTop: 22, textDecoration: 'none' }}>확인</a>
        </div>
      </div></div></div>
    );
  }

  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead"><div className="ht"><h1>도매 사업자 신청</h1><span className="vsub">WHOLESALE / B2B</span></div></header>

      <form onSubmit={submit} style={{ padding: '14px 16px 28px' }}>
        <div className="ws-note">사업자등록증 인증 후 <b>관리자 승인</b>을 거치면 도매 전용관에서 <b>박스 단위·복수 배송지</b> 주문을 이용하실 수 있어요.</div>

        {!loggedIn && (
          <div className="infocard">
            <h3 className="ws-h">로그인 정보</h3>
            <div className="field"><label>아이디 *</label><input value={form.id} onChange={set('id')} autoComplete="username" placeholder="도매 계정 아이디" /></div>
            <div className="field"><label>비밀번호 (8자 이상) *</label><input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></div>
          </div>
        )}

        <div className="infocard">
          <h3 className="ws-h">사업자 정보</h3>
          <div className="field"><label>상호(회사명) *</label><input value={form.company_name} onChange={set('company_name')} placeholder="예: 올리브청과" /></div>
          <div className="field"><label>사업자등록번호 *</label><input value={form.business_no} onChange={set('business_no')} inputMode="numeric" placeholder="000-00-00000" /></div>
          <div className="field"><label>대표자명</label><input value={form.owner_name} onChange={set('owner_name')} /></div>
          <div className="field"><label>담당자 연락처</label><input value={form.contact_phone} onChange={set('contact_phone')} placeholder="010-0000-0000" /></div>
          <div className="field"><label>이메일</label><input value={form.contact_email} onChange={set('contact_email')} placeholder="tax@company.com" /></div>
        </div>

        <div className="infocard">
          <h3 className="ws-h">사업장 주소</h3>
          <div className="field">
            <label>주소</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.zipcode} readOnly placeholder="우편번호" style={{ width: 96, flex: 'none', background: '#f6f8f5' }} />
              <button type="button" className="btn btn-line btn-sm" style={{ flex: 'none' }} onClick={() => setSearching(true)}>주소 검색</button>
            </div>
            <input value={form.address} onChange={set('address')} placeholder="주소 검색으로 입력" style={{ marginTop: 8 }} />
          </div>
          <div className="field"><label>상세주소</label><input value={form.detail_address} onChange={set('detail_address')} /></div>
        </div>

        <div className="infocard">
          <h3 className="ws-h">사업자등록증 *</h3>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadCert} style={{ display: 'none' }} />
          {form.cert_preview
            ? <img src={form.cert_preview} alt="사업자등록증" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--line)', background: '#f6f8f5' }} />
            : <div className="ws-cert-empty">사업자등록증 사본을 첨부해 주세요<br /><span>(jpg/png, 10MB 이하)</span></div>}
          <button type="button" className="btn btn-line btn-sm" style={{ marginTop: 8 }} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? '업로드 중…' : form.cert_key ? '다시 첨부' : '사업자등록증 업로드'}
          </button>
        </div>

        <button className="authbtn" disabled={busy}>{busy ? '접수 중…' : '도매 사업자 신청'}</button>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>제출한 서류는 승인 심사 용도로만 안전하게 보관됩니다.</p>
      </form>

      {searching && <AddressSearch onClose={() => setSearching(false)} onSelect={({ zipcode, address }) => { setForm((f) => ({ ...f, zipcode, address })); setSearching(false); }} />}
      <Toaster />
    </div></div></div>
  );
}
