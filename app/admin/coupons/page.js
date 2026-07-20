'use client';
import Crud from '@/components/admin/Crud';
import { won } from '@/lib/format';

export default function AdminCoupons() {
  return (
    <Crud
      resource="coupon"
      title="쿠폰·프로모션"
      searchKeys={['code', 'name']}
      columns={[
        { key: 'code', label: '코드' },
        { key: 'name', label: '이름' },
        { key: 'value', label: '혜택', render: (r) => r.type === 'percent' ? `${r.value}%` : `${won(r.value)}원` },
        { key: 'min_order', label: '최소주문', render: (r) => `${won(r.min_order)}원` },
        { key: 'used_count', label: '사용/발급', render: (r) => `${r.used_count} / ${r.issue_limit ?? '∞'}` },
        { key: 'until', label: '종료일', render: (r) => r.until || '-' },
        {
          key: 'is_active', label: '활성',
          render: (r, { update }) => <div className={`switch ${r.is_active ? 'on' : ''}`} onClick={() => update({ is_active: !r.is_active })}><i /></div>,
        },
      ]}
      fields={[
        { key: 'code', label: '쿠폰 코드', type: 'text' },
        { key: 'name', label: '이름', type: 'text' },
        { key: 'type', label: '할인 방식', type: 'select', options: [{ value: 'amount', label: '금액 할인' }, { value: 'percent', label: '% 할인' }] },
        { key: 'value', label: '할인값', type: 'number' },
        { key: 'min_order', label: '최소 주문금액', type: 'number' },
        { key: 'issue_limit', label: '발급 한도 (비우면 무제한)', type: 'number', skipEmpty: true },
        { key: 'until', label: '종료일 (YYYY-MM-DD)', type: 'text', skipEmpty: true },
        { key: 'is_active', label: '활성', type: 'checkbox' },
      ]}
    />
  );
}
