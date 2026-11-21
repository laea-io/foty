/**
 * 시연용 QR 모양. 실제로 읽히는 QR이 아니다(디자인의 "시연용 QR").
 * 체크인 연동 때 서명된 토큰으로 진짜 QR을 만든다.
 */
export function DemoQr({ size = 196, seed = 7 }: { size?: number; seed?: number }) {
  const n = 25
  const cell = size / n
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      if (inBox(ox, oy)) {
        const dx = x - ox
        const dy = y - oy
        const ring = dx === 0 || dy === 0 || dx === 6 || dy === 6
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        return ring || core ? 1 : 0
      }
    }
    return -1
  }
  // 작은 의사 난수(mulberry32) — 같은 seed면 같은 모양
  let a = seed * 2654435761
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const cells: [number, number][] = []
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y)
      const r = rnd()
      const on = f >= 0 ? f === 1 : r < 0.48
      if (on) cells.push([x, y])
    }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="체크인 QR(시연용)">
      <title>체크인 QR(시연용)</title>
      {cells.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x * cell}
          y={y * cell}
          width={cell + 0.2}
          height={cell + 0.2}
          fill="#0b0d12"
        />
      ))}
    </svg>
  )
}
