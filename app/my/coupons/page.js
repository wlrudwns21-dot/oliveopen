import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getCartCount } from '@/lib/shop';
import { won } from '@/lib/format';
import MyHeader from '@/components/MyHeader';
import PhoneNav from '@/components/PhoneNav';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const s = getMemberSession();
  if (!s) redirect('/login?next=/my/coupons');
  const sb = db();
  const [{ data: coupons }, { data: member }, cartCount] = await Promise.all([
    sb.from('coupon').select('*, product:target_product_pk(name)').eq('is_active', true).order('pk', { ascending: false }),
    sb.from('member').select('grade').eq('pk', s.pk).single(),
    getCartCount(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const grade = member?.grade || null;
  // 내 등급에 해당하는 쿠폰만 (전체 대상 + 내 등급 전용)
  const usable = (coupons || []).filter((c) =>
    (!c.until || c.until >= today) &&
    (!c.issue_limit || c.used_count < c.issue_limit) &&
    (!c.target_grade || c.target_grade === grade)
  );

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <MyHeader title="쿠폰함" sub="COUPONS" />
          <div style={{ padding: '14px 16px 0' }}>
            {usable.map((c) => (
              <div key={c.pk} style={{
                display: 'flex', alignItems: 'center', background: 'linear-gradient(120deg,#236239,#143E22)',
                color: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 12, boxShadow: 'var(--shadow)', gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
                    {c.type === 'percent' ? `${c.value}%` : `${won(c.value)}원`}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mint-soft)', marginLeft: 8 }}>할인</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mint-soft)', marginTop: 5 }}>
                    {won(c.min_order)}원 이상 · {c.until ? `~${c.until}` : '상시'}
                    {c.target_grade ? ` · ${c.target_grade} 전용` : ''}
                    {c.product?.name ? ` · ${c.product.name} 구매 시` : ''}
                  </div>
                </div>
                <div style={{ borderLeft: '1px dashed rgba(255,255,255,.35)', paddingLeft: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--mint-soft)' }}>코드</div>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.5px' }}>{c.code}</div>
                </div>
              </div>
            ))}
            {!usable.length && <div className="empty" style={{ padding: '60px 20px' }}>사용 가능한 쿠폰이 없어요</div>}
            <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
              결제 화면에서 쿠폰이 자동으로 적용돼요 🎟️<br />(가장 할인이 큰 쿠폰 우선)
            </p>
          </div>
          <div style={{ height: 20 }} />
        </div>
        <PhoneNav cartCount={cartCount} />
      </div>
    </div>
  );
}
