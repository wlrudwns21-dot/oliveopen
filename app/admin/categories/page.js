'use client';
import Crud from '@/components/admin/Crud';

export default function AdminCategories() {
  return (
    <Crud
      resource="category"
      title="카테고리 관리"
      searchKeys={['name', 'slug']}
      columns={[
        { key: 'sort_order', label: '순서' },
        { key: 'name', label: '카테고리명' },
        { key: 'slug', label: '슬러그(영문키)' },
        {
          key: 'is_active', label: '노출',
          render: (r, { update }) => <div className={`switch ${r.is_active ? 'on' : ''}`} onClick={() => update({ is_active: !r.is_active })}><i /></div>,
        },
      ]}
      fields={[
        { key: 'name', label: '카테고리명', type: 'text' },
        { key: 'slug', label: '슬러그 (영문·숫자, 예: fruits, gift-set)', type: 'text' },
        { key: 'sort_order', label: '정렬 순서', type: 'number' },
        { key: 'is_active', label: '노출', type: 'checkbox' },
      ]}
    />
  );
}
