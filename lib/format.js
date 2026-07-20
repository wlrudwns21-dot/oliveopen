export const won = (n) => Number(n || 0).toLocaleString('ko-KR');

export const ORDER_STATUS = {
  pending: '입금대기',
  confirmed: '결제완료',
  preparing: '상품준비',
  shipping: '배송중',
  delivered: '배송완료',
  canceled: '취소',
  cancelled: '취소',
  partial_canceled: '부분취소',
  return_requested: '반품접수',
  return_completed: '반품완료',
};

export const RETURN_STATUS = {
  requested: '접수',
  completed: '완료',
  rejected: '거절',
};

export const PAY_STATUS = {
  paid: '결제완료',
  partial_canceled: '부분취소',
  canceled: '취소',
};

export const SHIP_FREE = 30000;
export const SHIP_FEE = 3000;

export const dt = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '');
