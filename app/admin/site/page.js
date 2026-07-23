'use client';
import { useEffect, useMemo, useState } from 'react';
import { list, create, update, remove } from '@/lib/adminApi';
import ImageUploader from '@/components/admin/ImageUploader';

const THEMES = [
  { v: 'green', l: '딥그린', bg: 'linear-gradient(135deg,#1C5230,#143E22)', fg: '#FBF6EA' },
  { v: 'cream', l: '크림', bg: 'linear-gradient(135deg,#F0EBE0,#E4DCCC)', fg: '#3A342C' },
  { v: 'berry', l: '베리', bg: 'linear-gradient(135deg,#7a3f86,#4b2a72)', fg: '#fbf0fb' },
];

function parse(v) { try { return JSON.parse(v); } catch { return null; } }
function uid() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* 히어로 미리보기 (실제 홈과 동일 스타일 축소판) */
function HeroPreview({ s }) {
  if (s.mode === 'image') {
    return (
      <div style={{ height: 120, borderRadius: 16, overflow: 'hidden', background: '#eef3ed' }}>
        {s.fullImage ? <img src={s.fullImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#9aa08c', fontSize: 12 }}>통 이미지를 업로드하세요</div>}
      </div>
    );
  }
  const th = THEMES.find((t) => t.v === (s.theme || 'green')) || THEMES[0];
  return (
    <div style={{ position: 'relative', height: 120, borderRadius: 16, overflow: 'hidden', background: th.bg, color: th.fg, display: 'flex', alignItems: 'center', padding: 16 }}>
      <div style={{ maxWidth: '72%', zIndex: 2 }}>
        <div style={{ fontSize: 10, fontStyle: 'italic', opacity: 0.85 }}>{s.eyebrow}</div>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{s.title || '제목'}</div>
        <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 3 }}>{s.desc}</div>
        <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 999, background: th.v === 'green' ? '#7DC894' : th.v === 'cream' ? '#1C5230' : '#fff', color: th.v === 'cream' ? '#fff' : '#143012' }}>{s.cta || '지금 보기'}</span>
      </div>
      <div style={{ position: 'absolute', right: -14, bottom: -14, width: 110, height: 110, borderRadius: '50%', overflow: 'hidden' }}>
        {s.image && <img src={s.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
    </div>
  );
}

export default function AdminSite() {
  const [rows, setRows] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => list('site_config').then(setRows).catch((e) => say(e.message));
  useEffect(() => { load(); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const byKey = useMemo(() => {
    const m = {};
    (rows || []).forEach((r) => { m[r.config_key] = r; });
    return m;
  }, [rows]);

  const slides = useMemo(() => (rows || [])
    .filter((r) => r.config_key.startsWith('main_slide/'))
    .map((r) => ({ row: r, data: parse(r.config_value) || {} }))
    .sort((a, b) => (a.data.sort_order || 0) - (b.data.sort_order || 0)), [rows]);

  async function saveConfig(key, valueObj) {
    const existing = byKey[key];
    const config_value = typeof valueObj === 'string' ? valueObj : JSON.stringify(valueObj);
    try {
      if (existing) await update('site_config', existing.pk, { config_value });
      else await create('site_config', { config_key: key, config_value });
      say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }

  async function saveSlide(row, data) {
    const config_value = JSON.stringify(data);
    try {
      if (row) await update('site_config', row.pk, { config_value });
      else await create('site_config', { config_key: `main_slide/${data.id}`, config_value });
      say('저장했어요'); load();
    } catch (e) { say(e.message); }
  }
  async function delSlide(pk) {
    if (!confirm('이 배너를 삭제할까요?')) return;
    try { await remove('site_config', pk); say('삭제했어요'); load(); } catch (e) { say(e.message); }
  }

  if (rows === null) return <div className="empty" style={{ paddingTop: 80 }}>불러오는 중…</div>;

  return (
    <>
      <div className="adm-head"><div><h1>홈 화면 편집</h1><span className="sub">HOME EDITOR</span></div></div>

      {/* 사이트 기본 */}
      <SiteTitle value={byKey['site_title']?.config_value || ''} onSave={(v) => saveConfig('site_title', v)} />

      {/* 히어로 배너 */}
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>홈 히어로 배너</h2>
          <button className="btn btn-green btn-sm" onClick={() => saveSlide(null, { id: uid(), mode: 'compose', theme: 'green', eyebrow: '', title: '새 배너', desc: '', cta: '지금 보기', link: '/category', image: '', fullImage: '', sort_order: slides.length, active: true })}>+ 배너 추가</button>
        </div>
        <p className="sectit">홈 화면 최상단에서 자동으로 넘어가는 큰 배너입니다. <b>구성형</b>(색상·문구 직접 편집 + 참고 이미지)과 <b>통 이미지</b>(완성된 이미지 1장 업로드) 두 방식 중 선택할 수 있어요.</p>
        {slides.map((s) => <HeroEditor key={s.row.pk} slide={s} onSave={(data) => saveSlide(s.row, data)} onDelete={() => delSlide(s.row.pk)} />)}
        {!slides.length && <div className="empty">배너가 없어요. + 배너 추가를 눌러 만들어 보세요.</div>}
      </div>

      {/* 홈 문구 */}
      <HomeText value={parse(byKey['home_text']?.config_value) || {}} onSave={(v) => saveConfig('home_text', v)} />

      {/* 신선보장 배너 */}
      <HomeBanner value={parse(byKey['home_banner']?.config_value) || {}} onSave={(v) => saveConfig('home_banner', v)} />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function SiteTitle({ value, onSave }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="panel">
      <h2>사이트 이름</h2>
      <p className="sectit">브라우저 탭 제목 등에 쓰이는 사이트 이름이에요.</p>
      <div style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
        <input className="site-inp" value={v} onChange={(e) => setV(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-green btn-sm" onClick={() => onSave(v)}>저장</button>
      </div>
    </div>
  );
}

function HeroEditor({ slide, onSave, onDelete }) {
  const [d, setD] = useState(slide.data);
  useEffect(() => setD(slide.data), [slide.row.pk]);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ border: '1px solid #E4EBE3', borderRadius: 14, padding: 16, marginBottom: 14, background: '#fafcf9' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="hero-edit-grid">
        {/* 왼쪽: 미리보기 */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>미리보기 (실제 홈 화면 모습)</div>
          <HeroPreview s={d} />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#43503f', display: 'flex', alignItems: 'center', gap: 6 }}>노출
              <span className={`switch ${d.active !== false ? 'on' : ''}`} onClick={() => set('active', d.active === false)}><i /></span>
            </label>
            <input type="number" value={d.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} title="순서" style={{ width: 64, border: '1px solid #E4EBE3', borderRadius: 8, padding: '6px 8px' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>순서</span>
          </div>
        </div>

        {/* 오른쪽: 편집 */}
        <div>
          {/* 방식 선택 */}
          <div style={{ display: 'inline-flex', background: '#e9ede7', borderRadius: 10, padding: 3, marginBottom: 12 }}>
            <button className={`segb ${(d.mode || 'compose') === 'compose' ? 'on' : ''}`} onClick={() => set('mode', 'compose')}>구성형(색상·문구)</button>
            <button className={`segb ${d.mode === 'image' ? 'on' : ''}`} onClick={() => set('mode', 'image')}>통 이미지</button>
          </div>

          {d.mode === 'image' ? (
            <>
              <ImageUploader label="배너 이미지 (완성된 이미지 1장 · 가로 넓은 형태 권장)" value={d.fullImage || ''} onChange={(url) => set('fullImage', url)} tall />
              <div className="field"><label>클릭 시 이동 링크</label><input value={d.link || ''} onChange={(e) => set('link', e.target.value)} placeholder="/category, /product/gamgyul 등" /></div>
            </>
          ) : (
            <>
              <div className="field">
                <label>배경 색상 테마</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {THEMES.map((t) => (
                    <button key={t.v} onClick={() => set('theme', t.v)} title={t.l}
                      style={{ flex: 1, height: 34, borderRadius: 8, background: t.bg, border: (d.theme || 'green') === t.v ? '2px solid var(--green)' : '2px solid transparent', color: t.fg, fontSize: 11, fontWeight: 700 }}>{t.l}</button>
                  ))}
                </div>
              </div>
              <div className="field"><label>윗 문구 (영문 소제목)</label><input value={d.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Jeju Sun-ripened" /></div>
              <div className="field"><label>제목 (줄바꿈은 Enter)</label><textarea rows={2} value={d.title || ''} onChange={(e) => set('title', e.target.value)} placeholder={'한 입에 퍼지는\n제주의 단맛'} /></div>
              <div className="field"><label>설명</label><input value={d.desc || ''} onChange={(e) => set('desc', e.target.value)} /></div>
              <div className="row2">
                <div className="field"><label>버튼 문구</label><input value={d.cta || ''} onChange={(e) => set('cta', e.target.value)} placeholder="지금 보기" /></div>
                <div className="field"><label>이동 링크</label><input value={d.link || ''} onChange={(e) => set('link', e.target.value)} placeholder="/category" /></div>
              </div>
              <ImageUploader label="참고 이미지 (오른쪽 원형에 표시 · 과일 사진 등)" value={d.image || ''} onChange={(url) => set('image', url)} />
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #E4EBE3' }} onClick={onDelete}>삭제</button>
        <button className="btn btn-green btn-sm" onClick={() => onSave(d)}>이 배너 저장</button>
      </div>
    </div>
  );
}

function HomeText({ value, onSave }) {
  const [d, setD] = useState(value);
  useEffect(() => setD(value), [JSON.stringify(value)]);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  return (
    <div className="panel">
      <h2>홈 문구</h2>
      <p className="sectit">홈 화면 곳곳의 안내 문구예요. 각 항목이 화면 어디에 표시되는지 아래 설명을 참고하세요.</p>
      <FieldRow label="검색창 안내문" hint="홈 상단 🔍 검색 입력창 안 회색 글씨" v={d.searchPlaceholder || ''} onChange={(v) => set('searchPlaceholder', v)} />
      <FieldRow label="카테고리 제목" hint="'카테고리' 원형 목록 위 제목" v={d.catTitle || ''} onChange={(v) => set('catTitle', v)} />
      <FieldRow label="MD's Pick 라벨" hint="상품 그리드 위 작은 초록 영문 라벨" v={d.pickLabel || ''} onChange={(v) => set('pickLabel', v)} />
      <FieldRow label="MD's Pick 제목" hint="상품 그리드 위 큰 제목" v={d.pickTitle || ''} onChange={(v) => set('pickTitle', v)} />
      <button className="btn btn-green btn-sm" style={{ marginTop: 6 }} onClick={() => onSave(d)}>홈 문구 저장</button>
    </div>
  );
}

function HomeBanner({ value, onSave }) {
  const [d, setD] = useState(value);
  useEffect(() => setD(value), [JSON.stringify(value)]);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  return (
    <div className="panel">
      <h2>신선보장 배너</h2>
      <p className="sectit">홈 중간의 초록색 가로 배너(오른쪽 GO 버튼)예요.</p>
      <FieldRow label="제목" hint="배너 굵은 제목" v={d.title || ''} onChange={(v) => set('title', v)} />
      <FieldRow label="설명" hint="제목 아래 작은 설명" v={d.desc || ''} onChange={(v) => set('desc', v)} />
      <div className="row2">
        <FieldRow label="버튼 문구" hint="오른쪽 동그란 버튼" v={d.cta || ''} onChange={(v) => set('cta', v)} />
        <FieldRow label="이동 링크" hint="버튼 클릭 시 이동" v={d.link || ''} onChange={(v) => set('link', v)} />
      </div>
      <button className="btn btn-green btn-sm" style={{ marginTop: 6 }} onClick={() => onSave(d)}>배너 저장</button>
    </div>
  );
}

function FieldRow({ label, hint, v, onChange }) {
  return (
    <div className="field">
      <label>{label} {hint && <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 11 }}>· {hint}</span>}</label>
      <input value={v} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
