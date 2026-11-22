import Link from 'next/link'
import { Badge, Photo, Progress, Verified } from '@/components/ui/primitives'
import { type Theme, themeBadge } from '@/lib/demo/themes'

/** 모바일 목록형 테마 카드(88px 사진 + 네 줄) */
export function ThemeRow({ t, href }: { t: Theme; href?: string }) {
  const b = themeBadge(t)
  const host = t.hostName ? { name: t.hostName, kind: t.hostKind ?? 'business' } : null
  return (
    <Link href={href ?? `/themes/${t.id}`} className="flex gap-3.5 py-3.5 text-ink no-underline">
      <Photo
        src={t.image.src}
        alt={t.image.alt}
        bg={t.image.bg}
        className="h-[88px] w-[88px] rounded-[12px]"
      />
      <div className="min-w-0 grow">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-extrabold tracking-[-0.01em]">
            {t.dow} {t.start}
          </span>
          <Badge tone={b.tone}>{b.label}</Badge>
        </div>
        <div className="mt-1 truncate text-[15px] font-semibold tracking-[-0.02em]">{t.title}</div>
        <div className="mt-[3px] truncate text-[12px] text-sub">
          {t.place} · {t.current}/{t.max}명 · {t.from}에서 {t.travel}
        </div>
        <div className="mt-1 truncate text-[11px] text-sub">{t.route}</div>
        {host && (
          <div className="mt-[5px] flex items-center gap-1.5 text-[11px] text-muted">
            <span>{host.name}</span>
            {t.hostId === 'foty' ? <span>· 운영팀이 짠 코스</span> : <Verified kind={host.kind} />}
          </div>
        )}
      </div>
    </Link>
  )
}

/** 데스크톱 격자형 테마 카드(210px 사진 + 성사 진행) */
export function ThemeTile({ t, href }: { t: Theme; href?: string }) {
  const b = themeBadge(t)
  const host = t.hostName ? { name: t.hostName, kind: t.hostKind ?? 'business' } : null
  return (
    <Link href={href ?? `/themes/${t.id}`} className="block min-w-0 text-ink no-underline">
      <Photo
        src={t.image.src}
        alt={t.image.alt}
        bg={t.image.bg}
        className="h-[210px] w-full rounded-[20px]"
      />
      <div className="mt-3.5 flex items-center gap-1.5">
        <span className="text-[15px] font-extrabold">
          {t.dow} {t.start}
        </span>
        <Badge tone={b.tone}>{b.label}</Badge>
      </div>
      <div className="mt-[5px] text-[17px] font-bold tracking-[-0.03em]">{t.title}</div>
      <div className="mt-1 text-[13px] text-sub">
        {t.place} · {t.from}에서 {t.travel} · {t.cost} 내외
      </div>
      <div className="mt-1 text-[12px] text-sub">{t.route}</div>
      {host && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
          <span>{host.name}</span>
          {t.hostId === 'foty' ? <span>· 운영팀이 짠 코스</span> : <Verified kind={host.kind} />}
        </div>
      )}
      <div className="mt-3">
        <Progress current={t.current} max={t.max} min={t.min} />
      </div>
    </Link>
  )
}

/** 작은 테마 요약(56px 사진 + 제목 + 날짜) — 신청 완료·성사 화면 등 */
export function ThemeMini({ t, className }: { t: Theme; className?: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-[16px] bg-face p-3 ${className ?? ''}`}>
      <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="h-14 w-14 rounded-[14px]" />
      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-[-0.02em]">{t.title}</div>
        <div className="mt-0.5 text-[12px] text-sub">
          {t.date} {t.start} · {t.place}
        </div>
      </div>
    </div>
  )
}
