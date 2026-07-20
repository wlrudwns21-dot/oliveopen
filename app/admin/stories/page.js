'use client';
import Crud from '@/components/admin/Crud';

export default function AdminStories() {
  return (
    <Crud
      resource="lounge_story"
      title="라운지 스토리"
      searchKeys={['title', 'tag']}
      columns={[
        { key: 'sort_order', label: '순서' },
        { key: 'tag', label: '태그' },
        { key: 'title', label: '제목' },
        { key: 'link', label: '링크' },
        {
          key: 'is_published', label: '게시',
          render: (r, { update }) => <div className={`switch ${r.is_published ? 'on' : ''}`} onClick={() => update({ is_published: !r.is_published })}><i /></div>,
        },
      ]}
      fields={[
        { key: 'tag', label: '태그', type: 'text' },
        { key: 'eyebrow', label: '아이브로우 (영문)', type: 'text' },
        { key: 'title', label: '제목', type: 'text' },
        { key: 'description', label: '설명', type: 'textarea' },
        { key: 'image_url', label: '이미지 URL', type: 'text', placeholder: '/assets/brand/season.jpg' },
        { key: 'link', label: '이동 링크', type: 'text', placeholder: '/season' },
        { key: 'sort_order', label: '정렬 순서', type: 'number' },
        { key: 'is_published', label: '게시', type: 'checkbox' },
      ]}
    />
  );
}
