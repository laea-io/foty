import { KakaoMap } from '@/components/map/kakao-map'
import type { Stop } from '@/lib/demo/themes'

/**
 * 그룹 공간의 코스 지도. stops에 좌표가 있으면 카카오맵, 없으면 장소 순서를 보여 주는 약도 그림.
 * mini: 모바일 일정 아래 140px · tall: 데스크톱 오른쪽 560px / 모바일 지도 보기
 */
const shapes = {
  mini: {
    box: '0 0 350 140',
    road: 'M-10 112C60 102 110 74 150 56S260 28 360 40',
    roadW: 10,
    water: 'M210 150C230 112 270 94 360 90V150z',
    pts: [
      [70, 46],
      [150, 70],
      [262, 104],
      [310, 60],
    ],
    r: 11,
    fs: 11,
    line: 2,
    dash: '1 7',
  },
  tall: {
    box: '0 0 520 560',
    road: 'M-10 420C120 392 200 252 280 213S420 112 540 146',
    roadW: 14,
    water: 'M300 570C330 420 400 347 540 336V570z',
    pts: [
      [120, 110],
      [250, 190],
      [400, 260],
      [440, 380],
    ],
    r: 14,
    fs: 13,
    line: 2.5,
    dash: '1 8',
  },
} as const

export function RouteMap({
  count,
  stops,
  kind = 'mini',
  className,
}: {
  count: number
  stops?: Stop[]
  kind?: keyof typeof shapes
  className?: string
}) {
  const s = shapes[kind]
  const pts = s.pts.slice(0, Math.max(1, Math.min(4, count)))
  return (
    <div className={`relative overflow-hidden bg-[#e6eaec] ${className ?? ''}`}>
      <KakaoMap points={stops ?? []} fixedIndex={stops?.findIndex((x) => x.fixed)} className="h-full w-full">
        <svg
          viewBox={s.box}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="block h-full w-full"
        >
          <path d={s.road} fill="none" stroke="#ffffff" strokeWidth={s.roadW} />
          <path d={s.water} fill="#d5dde3" />
          <path
            d={`M${pts.map((p) => p.join(' ')).join('L')}`}
            fill="none"
            stroke="#0b0d12"
            strokeWidth={s.line}
            strokeDasharray={s.dash}
            strokeLinecap="round"
          />
          {pts.map(([x, y], i) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r={s.r} fill="#0b0d12" />
              <text
                x={x}
                y={y + s.fs * 0.38}
                fill="#ffffff"
                fontSize={s.fs}
                fontWeight="600"
                textAnchor="middle"
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </KakaoMap>
    </div>
  )
}
