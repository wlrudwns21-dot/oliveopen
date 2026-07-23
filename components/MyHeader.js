import Link from 'next/link';
import { IcBack } from './icons';

/** 마이쇼핑 하위 페이지 공용 헤더 (뒤로가기 → /my) */
export default function MyHeader({ title, sub }) {
  return (
    <header className="viewhead">
      <Link href="/my" className="iconbtn" aria-label="뒤로" style={{ marginLeft: -6 }}><IcBack /></Link>
      <div className="ht"><h1>{title}</h1>{sub && <span className="vsub">{sub}</span>}</div>
    </header>
  );
}
