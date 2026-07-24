/** 어드민 제네릭 CRUD 대상 테이블 화이트리스트.
 *  perm: 필요한 권한 kind (denied 목록에 있으면 403)
 *  hide: 목록 조회 시 제외할 칼럼
 */
export const RESOURCES = {
  product: { table: 'product', select: '*, product_image(*), product_option(*)', order: 'sort_order' },
  product_option: { table: 'product_option', order: 'sort_order' },
  product_image: { table: 'product_image', order: 'sort_order' },
  category: { table: 'category', order: 'sort_order' },
  orders: { table: 'orders', select: '*, order_item(*), member:member_pk(id, nick), payment(*)' },
  order_return: { table: 'order_return', select: '*, orders:order_pk(order_no, total_amount, status), member:member_pk(id, nick)' },
  payment: { table: 'payment' },
  member: { table: 'member', perm: 'MANAGE_MEMBERS', hide: ['password'], select: 'pk, id, nick, pre_title, post_title, extra, grade, points, is_active, referral_code, referred_by, last_login_at, created_at, updated_at, member_group_mapping(local_member_group_pk)' },
  member_group: { table: 'member_group', perm: 'MANAGE_MEMBERS' },
  member_group_mapping: { table: 'member_group_mapping', perm: 'MANAGE_MEMBERS' },
  member_address: { table: 'member_address', perm: 'MANAGE_MEMBERS' },
  site_config: { table: 'site_config', order: 'config_key' },
  seasonal_item: { table: 'seasonal_item', order: 'sort_order' },
  lounge_story: { table: 'lounge_story', order: 'sort_order' },
  product_review: { table: 'product_review', select: '*, product:product_pk(name)' },
  coupon: { table: 'coupon', perm: 'MANAGE_COUPONS', select: '*, product:target_product_pk(name)' },
  inquiry: { table: 'inquiry', select: '*, member:member_pk(id, nick)' },
};
