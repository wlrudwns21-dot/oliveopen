import Link from 'next/link';

/** 도매 전용관 공통 안내(게이트) 화면 */
export function Gate({ icon, title, desc, cta }) {
  return (
    <div className="stage"><div className="phone pg-app"><div className="view">
      <header className="viewhead"><div className="ht"><h1>도매 전용관</h1><span className="vsub">WHOLESALE / B2B</span></div></header>
      <div style={{ textAlign: 'center', padding: '56px 28px' }}>
        <div style={{ fontSize: 54 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 8px' }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</p>
        {cta}
      </div>
    </div></div></div>
  );
}

export const Btn = ({ href, children }) => (
  <Link href={href} className="authbtn" style={{ display: 'inline-flex', justifyContent: 'center', marginTop: 22, textDecoration: 'none' }}>{children}</Link>
);
