// 출발지 — 서울·경기 동북부에서 남양주로 오기 쉬운 역(좌표는 역 중심 근사값).
// 이동 시간은 실제 경로 계산이 아니라 직선거리로 어림한 값이라 화면에 "약"을 붙인다.

export type Station = { name: string; lat: number; lng: number }

export const STATIONS: Station[] = [
  { name: '상봉역', lat: 37.5965, lng: 127.0852 },
  { name: '청량리역', lat: 37.5803, lng: 127.0469 },
  { name: '회기역', lat: 37.5895, lng: 127.0575 },
  { name: '왕십리역', lat: 37.5612, lng: 127.0371 },
  { name: '잠실역', lat: 37.5133, lng: 127.1001 },
  { name: '강변역', lat: 37.5352, lng: 127.0947 },
  { name: '건대입구역', lat: 37.5404, lng: 127.07 },
  { name: '성수역', lat: 37.5446, lng: 127.056 },
  { name: '천호역', lat: 37.5386, lng: 127.1236 },
  { name: '강남역', lat: 37.4979, lng: 127.0276 },
  { name: '수서역', lat: 37.4876, lng: 127.1017 },
  { name: '사당역', lat: 37.4766, lng: 126.9816 },
  { name: '서울역', lat: 37.5547, lng: 126.9707 },
  { name: '시청역', lat: 37.5657, lng: 126.9769 },
  { name: '종로3가역', lat: 37.5704, lng: 126.9921 },
  { name: '동대문역', lat: 37.5714, lng: 127.0098 },
  { name: '용산역', lat: 37.5298, lng: 126.9648 },
  { name: '여의도역', lat: 37.5216, lng: 126.9243 },
  { name: '홍대입구역', lat: 37.5572, lng: 126.9245 },
  { name: '신촌역', lat: 37.5551, lng: 126.9368 },
  { name: '노원역', lat: 37.6551, lng: 127.0613 },
  { name: '태릉입구역', lat: 37.6175, lng: 127.0751 },
  { name: '도봉산역', lat: 37.6896, lng: 127.0461 },
  { name: '의정부역', lat: 37.7385, lng: 127.0459 },
  { name: '망우역', lat: 37.5992, lng: 127.0925 },
  { name: '구리역', lat: 37.6032, lng: 127.1434 },
  { name: '도농역', lat: 37.6086, lng: 127.1612 },
  { name: '덕소역', lat: 37.5869, lng: 127.2089 },
  { name: '팔당역', lat: 37.5474, lng: 127.2437 },
  { name: '운길산역', lat: 37.5546, lng: 127.3101 },
  { name: '별내역', lat: 37.6423, lng: 127.127 },
  { name: '다산역', lat: 37.6243, lng: 127.1504 },
  { name: '진접역', lat: 37.7203, lng: 127.2032 },
  { name: '평내호평역', lat: 37.6528, lng: 127.2445 },
  { name: '마석역', lat: 37.6521, lng: 127.3117 },
  { name: '퇴계원역', lat: 37.6482, lng: 127.1435 },
  { name: '하남풍산역', lat: 37.5523, lng: 127.2037 },
  { name: '미사역', lat: 37.563, lng: 127.1928 },
  { name: '판교역', lat: 37.3948, lng: 127.1112 },
  { name: '수원역', lat: 37.2659, lng: 127.0 },
  { name: '인천역', lat: 37.4765, lng: 126.6168 },
  { name: '부평역', lat: 37.4895, lng: 126.7245 },
  { name: '김포공항역', lat: 37.5624, lng: 126.8013 },
  { name: '대화역', lat: 37.6762, lng: 126.7473 },
]

export const DEFAULT_ORIGIN = '상봉역'
export const MY_LOCATION = '내 위치'

export const findStation = (name?: string) => STATIONS.find((s) => s.name === name)

/** 출발지 이름(+ 내 위치 좌표 "37.5,127.0") → 좌표 */
export function originPoint(origin?: string, at?: string): { lat: number; lng: number } | null {
  if (origin === MY_LOCATION && at) {
    const [lat, lng] = at.split(',').map(Number)
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }
  return findStation(origin) ?? null
}

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** 직선거리로 어림한 이동 시간(분, 5분 단위). 대중교통은 갈아타기·걷기를 넉넉히 더한다 */
export function travelEstimate(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  car = false,
) {
  const d = km(from, to)
  const min = car ? 8 + d * 1.7 : 15 + d * 2.6
  return Math.max(10, Math.round(min / 5) * 5)
}
