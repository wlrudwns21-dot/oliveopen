'use client';
import Crud from '@/components/admin/Crud';
import { won, dt } from '@/lib/format';

const GRADE_CLASS = { GREEN: 'st-green', GOLD: 'st-orange', VIP: 'st-purple' };
const GROUPS = { 1: 'Administrator', 2: 'Guest', 3: 'Manager', 4: 'Operator', 5: 'CustomerService' };

export default function AdminMembers() {
  return (
    <Crud
      resource="member"
      title="회원 관리"
      searchKeys={['id', 'nick']}
      canCreate={false}
      columns={[
        { key: 'pk', label: 'PK' },
        { key: 'id', label: '아이디' },
        { key: 'nick', label: '닉네임' },
        { key: 'grade', label: '등급', render: (r) => <span className={`status-pill ${GRADE_CLASS[r.grade] || 'st-gray'}`}>{r.grade}</span> },
        { key: 'points', label: '적립금', render: (r) => `${won(r.points)}P` },
        { key: 'groups', label: '그룹', render: (r) => (r.member_group_mapping || []).map((m) => GROUPS[m.local_member_group_pk] || m.local_member_group_pk).join(', ') || '-' },
        {
          key: 'is_active', label: '활성',
          render: (r, { update }) => (
            <div className={`switch ${r.is_active ? 'on' : ''}`} onClick={() => update({ is_active: !r.is_active })}><i /></div>
          ),
        },
        { key: 'last_login_at', label: '최근 로그인', render: (r) => dt(r.last_login_at) || '-' },
      ]}
      fields={[
        { key: 'nick', label: '닉네임', type: 'text' },
        { key: 'grade', label: '등급', type: 'select', options: [{ value: 'GREEN', label: 'GREEN' }, { value: 'GOLD', label: 'GOLD' }, { value: 'VIP', label: 'VIP' }] },
        { key: 'points', label: '적립금', type: 'number' },
        { key: 'password', label: '비밀번호 재설정 (비우면 유지)', type: 'text', skipEmpty: true },
        { key: 'is_active', label: '활성 계정', type: 'checkbox' },
      ]}
    />
  );
}
