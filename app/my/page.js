import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getCartCount } from '@/lib/shop';
import { won, dt, ORDER_STATUS, RETURN_STATUS } from '@/lib/format';
import PhoneNav from '@/components/PhoneNav';
import Toaster from '@/components/Toaster';
import { MyMenu, ReturnButton } from '@/components/MyClient';

export const dynamic = 'force-dynamic';

const ST_CLASS = {
  confirmed: 'st-blue', preparing: 'st-orange', shipping: 'st-green', delivered: 'st-gray',
  canceled: 'st-red', cancelled: 'st-red', return_requested: 'st-purple', return_completed: 'st-purple',
  pending: 'st-gray', partial_canceled: 'st-red',
};

export default async function MyPage() {
  const s = getMemberSession();
  if (!s) redirect('/login?next=/my');
  const sb = db();

  const [{ data: member }, { data: orders }, { data: wishes }, { data: returns }, { count: couponCount }, cartCount] = await Promise.all([
    sb.from('member').select('pk, id, nick, grade, points').eq('pk', s.pk).single(),
    sb.from('orders').select('*, order_item(*)').eq('member_pk', s.pk).order('pk', { ascending: false }).limit(20),
    sb.from('wishlist').select('pk').eq('member_pk', s.pk),
    sb.from('order_return').select('order_pk, status, memo').eq('member_pk', s.pk),
    sb.from('coupon').select('pk', { count: 'exact', head: true }).eq('is_active', true),
    getCartCount(),
  ]);
  if (!member) redirect('/login?next=/my');

  const returnByOrder = {};
  (returns || []).forEach((r) => { returnByOrder[r.order_pk] = r; });
  const flowCount = (st) => (orders || []).filter((o) => o.status === st).length;
  const canReturn = (o) => ['confirmed', 'preparing', 'shipping', 'delivered'].includes(o.status) && !returnByOrder[o.pk];

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <header className="viewhead">
            <div className="ht"><h1>마이쇼핑</h1><span className="vsub">MY OLIVE OPEN</span></div>
          </header>

          <div className="profile">
            <div className="av">{(member.nick || '올')[0]}</div>
            <div className="pin">
              <b>{member.nick}님</b><br />
              <span className="lv">🌿 {member.grade} 멤버십</span>
            </div>
          </div>

          <div className="statcard">
            <div className="s"><b>{won(member.points)}</b><span>적립금</span></div>
            <div className="s"><b>{couponCount || 0}</b><span>쿠폰</span></div>
            <div className="s"><b>{(wishes || []).length}</b><span>찜한 상품</span></div>
          </div>

          <div className="orderflow">
            <h3>진행 중인 주문</h3>
            <div className="oflow">
              <div className="st"><b>{flowCount('confirmed')}</b><span>결제완료</span></div>
              <div className="st"><b>{flowCount('preparing')}</b><span>상품준비</span></div>
              <div className="st"><b>{flowCount('shipping')}</b><span>배송중</span></div>
              <div className="st"><b>{flowCount('delivered')}</b><span>배송완료</span></div>
            </div>
          </div>

          <MyMenu wishCount={(wishes || []).length} couponCount={couponCount || 0} />

          <div className="olist" id="olist">
            {(orders || []).map((o) => (
              <div key={o.pk} className="oitem">
                <div className="otop">
                  <span className="ono">{o.order_no || `#${o.pk}`}</span>
                  <span className={`ost ${ST_CLASS[o.status] || 'st-gray'}`}>{ORDER_STATUS[o.status] || o.status}</span>
                </div>
                <div className="oprod">
                  {(o.order_item || []).map((i) => `${i.product_name || ''}${i.option_label ? ` (${i.option_label})` : ''} ×${i.quantity}`).join(', ')}
                </div>
                <div className="obtm">
                  <span className="osum">{won(o.total_amount)}원</span>
                  <span className="odate">{dt(o.created_at)}</span>
                </div>
                {returnByOrder[o.pk] && (
                  <div className="oprod" style={{ marginTop: 7 }}>
                    ↩️ 반품 {RETURN_STATUS[returnByOrder[o.pk].status] || returnByOrder[o.pk].status}
                    {returnByOrder[o.pk].status === 'rejected' && returnByOrder[o.pk].memo && (
                      <span style={{ display: 'block', marginTop: 3, color: 'var(--danger)', fontSize: 11.5 }}>사유: {returnByOrder[o.pk].memo}</span>
                    )}
                  </div>
                )}
                {canReturn(o) && <ReturnButton orderPk={o.pk} />}
              </div>
            ))}
            {!(orders || []).length && (
              <div style={{ textAlign: 'center', color: '#9aa08c', fontSize: 13, padding: '30px 0' }}>아직 주문이 없어요</div>
            )}
          </div>
        </div>
        <PhoneNav cartCount={cartCount} />
        <Toaster />
      </div>
    </div>
  );
}
