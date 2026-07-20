import Link from 'next/link';
import { db } from '@/lib/supabase';
import { getCartCount } from '@/lib/shop';
import PhoneNav from '@/components/PhoneNav';
import { IcChev } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function LoungePage() {
  const [{ data: stories }, cartCount] = await Promise.all([
    db().from('lounge_story').select('*').eq('is_published', true).order('sort_order'),
    getCartCount(),
  ]);

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <div className="ht"><h1>라운지</h1><span className="vsub">FRESH STORIES</span></div>
          </header>
          <div className="feed">
            {(stories || []).map((st) => (
              <Link key={st.pk} href={st.link || '/'} className="story">
                <div className="sp">
                  {st.image_url && <img src={st.image_url} alt="" />}
                  <span className="stag">{st.tag}</span>
                </div>
                <div className="sbody">
                  <div className="seyebrow">{st.eyebrow}</div>
                  <div className="stitle">{st.title}</div>
                  <div className="sdesc">{st.description}</div>
                  <div className="readmore">자세히 보기 <IcChev /></div>
                </div>
              </Link>
            ))}
            {!(stories || []).length && (
              <div style={{ textAlign: 'center', color: '#9aa08c', fontSize: 13, padding: '60px 0' }}>준비 중이에요</div>
            )}
          </div>
        </div>
        <PhoneNav cartCount={cartCount} />
      </div>
    </div>
  );
}
