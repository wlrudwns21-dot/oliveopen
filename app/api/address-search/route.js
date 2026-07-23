import { NextResponse } from 'next/server';

// 행정안전부 도로명주소 검색 API (juso.go.kr)
const JUSO_ENDPOINT = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const page = searchParams.get('page') || '1';
  const confmKey = process.env.JUSO_CONFM_KEY;

  if (!confmKey) {
    return NextResponse.json({ error: '주소 검색 승인키(JUSO_CONFM_KEY)가 설정되지 않았어요' }, { status: 500 });
  }
  if (!keyword) return NextResponse.json({ results: [], totalCount: 0, page: 1 });

  const params = new URLSearchParams({
    confmKey,
    currentPage: page,
    countPerPage: '10',
    keyword,
    resultType: 'json',
  });

  try {
    const res = await fetch(`${JUSO_ENDPOINT}?${params.toString()}`, { cache: 'no-store' });
    const j = await res.json();
    const common = j?.results?.common || {};
    if (common.errorCode && common.errorCode !== '0') {
      return NextResponse.json({ error: common.errorMessage || '주소 검색 오류' }, { status: 400 });
    }
    const results = (j?.results?.juso || []).map((a) => ({
      zipcode: a.zipNo,
      road: a.roadAddr,        // 도로명 전체 주소
      jibun: a.jibunAddr,      // 지번 주소
      building: a.bdNm || '',  // 건물명
    }));
    return NextResponse.json({
      results,
      totalCount: Number(common.totalCount || 0),
      page: Number(page),
    });
  } catch (e) {
    return NextResponse.json({ error: '주소 검색 서버에 연결할 수 없어요' }, { status: 502 });
  }
}
