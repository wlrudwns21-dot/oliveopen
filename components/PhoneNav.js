'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IcHome, IcGrid, IcLeaf, IcUser, IcBag } from './icons';

const TABS = [
  { href: '/', Icon: IcHome, label: '홈' },
  { href: '/category', Icon: IcGrid, label: '카테고리' },
  { href: '/lounge', Icon: IcLeaf, label: '라운지' },
  { href: '/my', Icon: IcUser, label: '마이쇼핑' },
  { href: '/cart', Icon: IcBag, label: '장바구니' },
];

export default function PhoneNav({ cartCount = 0 }) {
  const path = usePathname();
  return (
    <nav className="nav">
      {TABS.map(({ href, Icon, label }) => (
        <Link key={href} href={href} className={path === href ? 'on' : ''}>
          <Icon />
          {label}
          {href === '/cart' && cartCount > 0 && <span className="badge">{cartCount}</span>}
        </Link>
      ))}
    </nav>
  );
}
