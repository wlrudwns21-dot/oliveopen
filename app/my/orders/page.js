import { redirect } from 'next/navigation';
import { db, imageUrl } from '@/lib/supabase';
import { getMemberSession } from '@/lib/auth';
import { getCartCount } from '@/lib/shop';
import { won, dt, ORDER_STATUS, RETURN_STATUS } from '@/lib/format';
import MyHeader from '@/components/MyHeader';
import PhoneNav from '@/components/PhoneNav';
import Toaster from '@/components/Toaster';
import { ReturnButton } from '@/components/MyClient';

export const dynamic = 'force-dynamic';

const ST_CLASS = {
  confirmed: 'st-blue', preparing: 'st-orange', shipping: 'st-green', delivered: 'st-gray',
  canceled: 'st-red', cancelled: 'st-red', return_requested: 'st-purple', return_completed: 'st-purple',
  pending: 'st-gray', partial_canceled: 'st-red',
};

export default async function MyOrdersPage() {
  const s = getMemberSession();
  if (!s) redirect('/login?next=/my/orders');
  const sb = db();
  const [{ data: orders }, { data: returns }, cartCount] = await Promise.all([
    sb.from('orders').select('*, order_item(*, product:product_pk(sku, product_image(*)))').eq('member_pk', s.pk).order('pk', { ascending: false }),
    sb.from('order_return').select('order_pk, status, memo').eq('member_pk', s.pk),
    getCartCount(),
  ]);
  const returnBy = {};
  (returns || []).forEach((r) => { returnBy[r.order_pk] = r; });
  const canReturn = (o) => ['confirmed', 'preparing', 'shipping', 'delivered'].includes(o.status) && !returnBy[o.pk];
  const RET_LABEL = { requested: '접수', completed: '완료', rejected: '거절' };

  return (
    <div className="stage">
      <div className="phone pg-app">
        <div className="view">
          <MyHeader title="주문 내역" sub="ORDER HISTORY" />
          <div className="olist">
            {(orders || []).map((o) => {
              const firstImg = (o.order_item?.[0]?.product?.product_image || []).find((i) => i.purpose === 'thumbnail');
              return (
                <div key={o.pk} className="oitem">
                  <div className="otop">
                    <span className="ono">{o.order_no || `#${o.pk}`}</span>
                    <span className={`ost ${ST_CLASS[o.status] || 'st-gray'}`}>{ORDER_STATUS[o.status] || o.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                    <img src={imageUrl(firstImg?.storage_key)} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: 'var(--panel)', flex: 'none' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="oprod" style={{ margin: 0 }}>
                        {(o.order_item || []).map((i) => `${i.product_name || ''}${i.option_label ? ` (${i.option_label})` : ''} ×${i.quantity}`).join(', ')}
                      </div>
                      <div className="obtm" style={{ marginTop: 4 }}>
                        <span className="osum">{won(o.total_amount)}원</span>
                        <span className="odate">{dt(o.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {returnBy[o.pk] && (
                    <div className="oprod" style={{ marginTop: 8 }}>
                      ↩️ 반품 {RET_LABEL[returnBy[o.pk].status] || returnBy[o.pk].status}
                      {returnBy[o.pk].status === 'rejected' && returnBy[o.pk].memo && (
                        <span style={{ display: 'block', marginTop: 3, color: 'var(--danger)', fontSize: 11.5 }}>사유: {returnBy[o.pk].memo}</span>
                      )}
                    </div>
                  )}
                  {canReturn(o) && <ReturnButton orderPk={o.pk} />}
                </div>
              );
            })}
            {!(orders || []).length && (
              <div className="empty" style={{ padding: '60px 20px' }}>아직 주문이 없어요</div>
            )}
          </div>
        </div>
        <PhoneNav cartCount={cartCount} />
        <Toaster />
      </div>
    </div>
  );
}
