export const metadata = { title: '준비 중인 서비스' };

export default function GiftPage() {
  return (
    <div style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', background: 'radial-gradient(120% 80% at 50% 0%, #FAF7F0 0%, #F0EBE0 55%, #E4DCCC 100%)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 380 }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🎁</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F2E19', letterSpacing: '-0.4px' }}>준비 중인 서비스입니다</h1>
        <p style={{ fontSize: 15, color: '#5b6a4a', lineHeight: 1.7, marginTop: 14 }}>
          현재 선물 신청 서비스를 준비하고 있어요.<br />
          돌아가서 결제를 완료해 주시면 감사하겠습니다. 🙏
        </p>
      </div>
    </div>
  );
}
