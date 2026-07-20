'use client';
import Crud from '@/components/admin/Crud';
import { dt } from '@/lib/format';

export default function AdminReviews() {
  return (
    <Crud
      resource="product_review"
      title="리뷰 관리"
      searchKeys={['author', 'body']}
      canCreate={false}
      columns={[
        { key: 'pk', label: 'PK' },
        { key: 'product', label: '상품', render: (r) => r.product?.name || `#${r.product_pk}` },
        { key: 'author', label: '작성자' },
        { key: 'rating', label: '별점', render: (r) => '⭐'.repeat(r.rating) },
        { key: 'body', label: '내용', render: (r) => (r.body || '').slice(0, 40) },
        {
          key: 'status', label: '상태',
          render: (r, { update }) => (
            <button
              className={`status-pill ${r.status === 'approved' ? 'st-green' : 'st-orange'}`}
              onClick={() => update({ status: r.status === 'approved' ? 'pending' : 'approved' })}
            >
              {r.status === 'approved' ? '승인' : '대기'}
            </button>
          ),
        },
        { key: 'created_at', label: '작성일', render: (r) => dt(r.created_at) },
      ]}
      fields={[
        { key: 'rating', label: '별점 (1~5)', type: 'number' },
        { key: 'body', label: '내용', type: 'textarea' },
        { key: 'status', label: '상태', type: 'select', options: [{ value: 'pending', label: '대기' }, { value: 'approved', label: '승인' }] },
      ]}
    />
  );
}
