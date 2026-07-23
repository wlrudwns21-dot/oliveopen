/** 쿠폰 사용 가능 여부 판정 (조건: 활성·기간·발급한도·최소주문·회원등급·특정상품) */
export function couponUsable(c, { total = 0, grade = null, cartProductPks = [] } = {}) {
  if (!c || !c.is_active) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (c.until && String(c.until) < today) return false;
  if (c.issue_limit && c.used_count >= c.issue_limit) return false;
  if (total < (c.min_order || 0)) return false;
  if (c.target_grade && c.target_grade !== grade) return false;
  if (c.target_product_pk && !cartProductPks.includes(c.target_product_pk)) return false;
  return true;
}

export function couponDiscount(c, total) {
  return c.type === 'percent' ? Math.floor((total * c.value) / 100) : c.value;
}

/** 사용 불가 사유 메시지 (안내용) */
export function couponReason(c, { total = 0, grade = null, cartProductPks = [] } = {}) {
  if (!c || !c.is_active) return '사용할 수 없는 쿠폰이에요';
  const today = new Date().toISOString().slice(0, 10);
  if (c.until && String(c.until) < today) return '기간이 지난 쿠폰이에요';
  if (c.issue_limit && c.used_count >= c.issue_limit) return '소진된 쿠폰이에요';
  if (c.target_grade && c.target_grade !== grade) return `${c.target_grade} 등급 전용 쿠폰이에요`;
  if (c.target_product_pk && !cartProductPks.includes(c.target_product_pk)) return '해당 상품이 장바구니에 있어야 사용할 수 있어요';
  if (total < (c.min_order || 0)) return `${(c.min_order || 0).toLocaleString('ko-KR')}원 이상 주문 시 사용할 수 있어요`;
  return '사용할 수 없는 쿠폰이에요';
}
