// foty 마스코트(꽃 모양 몸 + 얼굴). 로고·빈 상태·스탬프에 쓴다.
const petals = [
  [79.0, 50.0],
  [70.5, 70.5],
  [50.0, 79.0],
  [29.5, 70.5],
  [21.0, 50.0],
  [29.5, 29.5],
  [50.0, 21.0],
  [70.5, 29.5],
]

const tones = {
  orange: { body: '#ff6a3d', face: '#0b0d12', eye: '#ffffff' },
  ink: { body: '#0b0d12', face: '#ffffff', eye: '#0b0d12' },
  gray: { body: '#dcdee2', face: '#9aa0aa', eye: '#ffffff' },
  pale: { body: '#e6e8eb', face: '#9aa0aa', eye: '#ffffff' },
} as const

export type MascotTone = keyof typeof tones

export function Mascot({
  size = 25,
  tone = 'orange',
  face = true,
  color,
  className,
  label,
}: {
  size?: number
  tone?: MascotTone
  /** false면 얼굴 없는 꽃 모양만(빈 스탬프 칸 등) */
  face?: boolean
  /** 얼굴 없는 모양의 몸 색을 직접 줄 때 */
  color?: string
  className?: string
  label?: string
}) {
  const t = tones[tone]
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: label이 있으면 <title>을 넣고, 없으면 장식(aria-hidden)이다
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`block flex-none ${className ?? ''}`}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    >
      {label && <title>{label}</title>}
      <g fill={color ?? t.body}>
        <circle cx="50" cy="50" r="32" />
        {petals.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="17.5" />
        ))}
      </g>
      {face && (
        <>
          <ellipse cx="29" cy="50" rx="7" ry="4.5" transform="rotate(-24 29 50)" fill={t.face} />
          <ellipse cx="71" cy="50" rx="7" ry="4.5" transform="rotate(24 71 50)" fill={t.face} />
          <rect x="33" y="40" width="34" height="32" rx="16" fill={t.face} />
          <circle cx="44" cy="54" r="2.6" fill={t.eye} />
          <circle cx="56" cy="54" r="2.6" fill={t.eye} />
        </>
      )}
    </svg>
  )
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span role="img" aria-label="foty" className="inline-flex items-center gap-[5px]">
      <Mascot size={Math.round(size * 1.04)} />
      <span
        aria-hidden="true"
        className="font-black italic leading-none tracking-[-0.07em] text-ink"
        style={{ fontSize: size }}
      >
        foty
      </span>
    </span>
  )
}
