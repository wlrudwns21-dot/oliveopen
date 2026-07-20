'use client';
import Crud from '@/components/admin/Crud';

export default function AdminSeasonal() {
  return (
    <Crud
      resource="seasonal_item"
      title="제철 캘린더"
      searchKeys={['name', 'origin']}
      columns={[
        { key: 'emoji', label: '' },
        { key: 'name', label: '품목' },
        { key: 'origin', label: '원산지' },
        { key: 'months', label: '제철(월)', render: (r) => (r.months || []).join(', ') },
        { key: 'product_pk', label: '연결 상품', render: (r) => r.product_pk ? `#${r.product_pk}` : '-' },
        {
          key: 'is_active', label: '노출',
          render: (r, { update }) => <div className={`switch ${r.is_active ? 'on' : ''}`} onClick={() => update({ is_active: !r.is_active })}><i /></div>,
        },
      ]}
      fields={[
        { key: 'name', label: '품목명', type: 'text' },
        { key: 'emoji', label: '이모지', type: 'text' },
        { key: 'color', label: '컬러 (예: #E84B5A)', type: 'text' },
        { key: 'origin', label: '원산지', type: 'text' },
        { key: 'months', label: '제철 월 (JSON, 시작→종료 순서)', type: 'json', placeholder: '[5,6,7,8]' },
        { key: 'product_pk', label: '연결 상품 PK (없으면 비움)', type: 'number', skipEmpty: true },
        { key: 'sort_order', label: '정렬 순서', type: 'number' },
        { key: 'is_active', label: '노출', type: 'checkbox' },
      ]}
    />
  );
}
