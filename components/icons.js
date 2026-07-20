/* 프로토타입 원본 SVG 아이콘 */
const S = (props) => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', ...props });

export const IcBell = () => (
  <svg {...S({ strokeWidth: 1.7 })}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const IcBag = ({ w = 1.7 }) => (
  <svg {...S({ strokeWidth: w })}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
);
export const IcSearch = () => (
  <svg {...S({ strokeWidth: 2 })}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IcChev = ({ w = 2.4 }) => (
  <svg {...S({ strokeWidth: w })}><path d="m9 18 6-6-6-6" /></svg>
);
export const IcBack = () => (
  <svg {...S({ strokeWidth: 2.2 })}><path d="m15 18-6-6 6-6" /></svg>
);
export const IcCheck = ({ w = 2.4 }) => (
  <svg {...S({ strokeWidth: w })}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IcHeart = ({ w = 1.9 }) => (
  <svg {...S({ strokeWidth: w })}><path d="M12 21s-7-4.6-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z" /></svg>
);
export const IcPlus = () => (
  <svg {...S({ strokeWidth: 2.6 })}><path d="M12 5v14M5 12h14" /></svg>
);
export const IcX = () => (
  <svg {...S({ strokeWidth: 2 })}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IcShare = () => (
  <svg {...S({ strokeWidth: 1.8 })}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></svg>
);
export const IcTruck = () => (
  <svg {...S({ strokeWidth: 1.8 })}><path d="M3 7h13l5 5v5h-3" /><path d="M3 17h11" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const IcTrash = () => (
  <svg {...S({ strokeWidth: 1.8 })}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
);
export const IcHome = () => (
  <svg {...S({ strokeWidth: 1.8 })}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const IcGrid = () => (
  <svg {...S({ strokeWidth: 1.8 })}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
);
export const IcLeaf = () => (
  <svg {...S({ strokeWidth: 1.8 })}><path d="M11 20A7 7 0 0 0 18 5c-3 0-5 2-7 5-2-3-4-5-7-5a7 7 0 0 0 7 15z" /></svg>
);
export const IcUser = () => (
  <svg {...S({ strokeWidth: 1.8 })}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const IcSun = () => (
  <svg {...S({ strokeWidth: 1.7 })}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>
);
export const IcCheckCircle = () => (
  <svg {...S({ strokeWidth: 1.7 })}><path d="M9 12l2 2 4-4" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
);
export const IcDoc = () => (
  <svg {...S({ strokeWidth: 1.7 })}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>
);
export const IcPin = () => (
  <svg {...S({ strokeWidth: 1.7 })}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const IcCoupon = () => (
  <svg {...S({ strokeWidth: 1.7 })}><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /><path d="M13 6v12" strokeDasharray="2 2" /></svg>
);
export const IcChat = () => (
  <svg {...S({ strokeWidth: 1.7 })}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></svg>
);
export const IcOut = () => (
  <svg {...S({ strokeWidth: 1.8 })}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
