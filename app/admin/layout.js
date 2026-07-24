'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IcOut } from '@/components/icons';

const MENU = [
  { href: '/admin', ico: '📊', label: '대시보드' },
  { href: '/admin/orders', ico: '📦', label: '주문 관리' },
  { href: '/admin/returns', ico: '↩️', label: '반품 관리' },
  { href: '/admin/products', ico: '🍊', label: '상품 관리' },
  { href: '/admin/seasonal', ico: '🗓️', label: '제철 캘린더' },
  { href: '/admin/site', ico: '🏠', label: '홈 화면 편집' },
  { href: '/admin/stories', ico: '🛋️', label: '라운지 스토리' },
  { href: '/admin/reviews', ico: '⭐', label: '리뷰 관리' },
  { href: '/admin/inquiries', ico: '💬', label: '1:1 문의' },
  { href: '/admin/members', ico: '👥', label: '회원 관리', perm: 'MANAGE_MEMBERS' },
  { href: '/admin/admins', ico: '🛡️', label: '어드민 승인', perm: 'MANAGE_MEMBERS' },
  { href: '/admin/coupons', ico: '🎟️', label: '쿠폰·프로모션', perm: 'MANAGE_COUPONS' },
  { href: '/admin/referrals', ico: '📈', label: '추천 매출 조회', perm: 'MANAGE_COUPONS' },
  { href: '/admin/partners', ico: '🤝', label: '파트너 관리', perm: 'MANAGE_MEMBERS' },
];

// 파트너(추천인) 계정 전용 메뉴
const PARTNER_MENU = [{ href: '/admin', ico: '📈', label: '내 매출 현황' }];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const router = useRouter();
  const isPublic = path === '/admin/login' || path === '/admin/apply';
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isPublic) { setChecked(true); return; }
    fetch('/api/admin/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { setSession(j.session); setChecked(true); })
      .catch(() => router.replace('/admin/login'));
  }, [isPublic, path]);

  if (isPublic) return children;
  if (!checked || !session) return <div className="empty" style={{ paddingTop: 140 }}>확인 중…</div>;

  const isPartner = !!session.isPartner;
  const denied = session.denied || [];
  let visible, role;
  if (isPartner) {
    // 파트너: 자기 매출 현황(/admin)만 접근
    if (path !== '/admin') { router.replace('/admin'); return null; }
    visible = PARTNER_MENU;
    role = '파트너';
  } else {
    visible = MENU.filter((m) => !m.perm || !denied.includes(m.perm));
    const cur = MENU.find((m) => m.href === path);
    if (cur?.perm && denied.includes(cur.perm)) { router.replace('/admin'); return null; }
    role = denied.length === 0 ? '마스터' : denied.includes('MANAGE_COUPONS') ? '운영자' : '관리자';
  }

  return (
    <div className="aui">
      <aside className="side">
        <div className="brand">
          <div className="emb"><img src="/assets/logo-emblem.png" alt="" /></div>
          <div>
            <b>Olive Open</b>
            <span>FRESH MARKET</span>
            <div className="adm">ADMIN CONSOLE</div>
          </div>
        </div>
        <nav className="navlist">
          {visible.map((m) => (
            <Link key={m.href} href={m.href} className={path === m.href ? 'on' : ''}>
              <span className="ico">{m.ico}</span>{m.label}
            </Link>
          ))}
        </nav>
        <div className="foot">
          <a href="/" target="_blank">🔗 실제 앱 새 창으로 보기</a>
          <button onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.replace('/admin/login'); }}>
            <IcOut /> 로그아웃
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="content">
          <div className="adm-head" style={{ marginBottom: 0 }}>
            <div style={{ marginLeft: 'auto' }} className="who">
              <span className="av">{(session.nick || '올')[0]}</span>
              <span>{session.nick}</span>
              <span className="role-chip">{role}</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
