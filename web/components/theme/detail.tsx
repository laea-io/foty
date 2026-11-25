import Link from 'next/link'
import type { ReactNode } from 'react'
import { BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { courseLength, DetailHead, HostBlock, InfoRows, MapSketch, StopList } from '@/components/theme/parts'
import { ShareButton } from '@/components/theme/share-button'
import { Icon } from '@/components/ui/icon'
import { Badge, ButtonLink, DemoNote, Note, Photo, Progress, Reason } from '@/components/ui/primitives'
import type { Host } from '@/lib/shared/people'
import type { Theme } from '@/lib/shared/theme'

const statusTone = (s: Theme['status']) => (s === '일정 확정' ? 'ink' : s === '취소' ? 'muted' : 'soft')

/**
 * 테마 상세 — 모집 중(기본). guest: 로그인 없이 보는 화면(위 안내 띠 + “가입하고 신청하기”).
 * 모집 마감·일정 확정·여행 완료는 components/theme/state-detail.tsx.
 * host: DB의 호스트(진행한 테마 수 포함) · action: 보는 사람에 따라 바뀌는 버튼(신청 취소 · 그룹 공간 …)
 * notice: 내 신청 상태 한 줄
 */
export function ThemeDetail({
  t,
  guest,
  host,
  action,
  notice,
}: {
  t: Theme
  guest?: boolean
  host?: Host | null
  action?: ReactNode
  notice?: ReactNode
}) {
  const left = t.min - t.current
  const matched = left <= 0
  const open = t.status === '모집 중'
  const rows: [string, string][] = [
    ['집결', t.meet],
    ['포함', t.include],
    ['제외', t.exclude],
    ['취소', '성사 전에는 언제든 취소할 수 있어요. 최소 인원이 안 차면 자동 취소돼요.'],
  ]
  const headline = matched ? '성사됐어요' : `성사까지 ${left}명`
  const cta = () =>
    action ??
    (guest ? (
      <ButtonLink href={`/login?next=/themes/${t.id}/apply`} variant="accent" size="lg" block>
        가입하고 신청하기
      </ButtonLink>
    ) : open ? (
      <ButtonLink href={`/themes/${t.id}/apply`} variant="accent" size="lg" block scroll={false}>
        참여 신청
      </ButtonLink>
    ) : (
      <ButtonLink href="/" variant="soft" size="lg" block aria-disabled>
        {t.status === '모집 마감' ? '모집이 마감됐어요' : t.status}
      </ButtonLink>
    ))

  return (
    <>
      {/* ── 모바일 ── */}
      <MobileFrame bottom>
        {guest && <GuestBanner />}
        <div className="relative h-80 overflow-hidden">
          <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="h-80 w-full" />
          <div className="absolute inset-x-0 top-0 h-[100px] bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_100%)]" />
          <div className="absolute top-2.5 right-3.5 left-3.5 flex justify-between">
            <Link
              href="/"
              aria-label="뒤로"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/92"
            >
              <Icon name="back" />
            </Link>
            <Link
              href={`/report?theme=${t.id}`}
              aria-label="신고"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/92"
            >
              <Icon name="flag" />
            </Link>
          </div>
          <span className="absolute right-4 bottom-3.5 inline-flex h-6 items-center rounded-full bg-[rgba(11,13,18,0.55)] px-[9px] text-[11px] font-semibold text-white">
            1 / {t.stops.length}
          </span>
        </div>
        <div className="px-5">
          <div className="mt-5 flex items-center gap-2">
            <span className="text-[14px] font-bold">
              {t.date} {t.start}
            </span>
            <Badge tone={statusTone(t.status)}>{t.status}</Badge>
          </div>
          <h1 className="mt-2 mb-0 text-[26px] leading-[33px] font-extrabold tracking-[-0.05em]">
            {t.title}
          </h1>
          <div className="mt-1.5 flex items-center gap-1 text-[13px] text-sub">
            <Icon name="pin" size={15} />
            핵심 장소 · {t.place} ({t.area})
          </div>
          <div className="mt-[22px] flex border-y border-line py-[18px]">
            <Fact label="시간" value={`${t.start}–${t.end}`} grow={1.3} />
            <Fact label="가는 길" value={`${t.from} ${t.travel}`} divider />
            <Fact label="예상 비용" value={t.cost} divider />
          </div>
          <div className="mt-5">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span
                className={`text-[18px] font-extrabold tracking-[-0.03em] ${matched ? 'text-ink' : 'text-warn'}`}
              >
                {headline}
              </span>
              <span className="text-[12px] text-sub">최대 {t.max}명</span>
            </div>
            <Progress
              current={t.current}
              max={t.max}
              min={t.min}
              deadline={t.deadline}
              deadlinePrefix="모집 마감"
            />
          </div>
          <Reason className="mt-[18px] gap-2.5">{t.reason}</Reason>
          {notice && <Note className="mt-4">{notice}</Note>}

          {host && (
            <>
              <DetailHead title="호스트" />
              <HostBlock host={host} />
            </>
          )}
          <DetailHead title="코스" aside={courseLength(t.stops, t.start, t.end)} />
          <StopList stops={t.stops} className="-mt-2" />
          <div className="mt-3.5">
            <InfoRows rows={rows} />
          </div>
          <DemoNote />
        </div>
        <BottomBar>
          <ShareButton title={t.title} />
          <div className="grow">{cta()}</div>
        </BottomBar>
      </MobileFrame>

      {/* ── 데스크톱 ── */}
      {guest && <GuestBanner wide />}
      <DesktopFrame>
        <div className="grid h-[420px] grid-cols-[2fr_1fr] gap-2">
          <Photo
            src={t.image.src}
            alt={t.image.alt}
            bg={t.image.bg}
            className="h-[420px] w-full rounded-[20px]"
          />
          <div className="flex flex-col gap-2">
            {t.stops
              .filter((s) => !s.fixed)
              .slice(0, 2)
              .map((s) => (
                <Photo
                  key={s.name}
                  src={s.image.src}
                  alt={s.image.alt}
                  bg={s.image.bg}
                  className="h-[206px] w-full rounded-[20px]"
                />
              ))}
          </div>
        </div>
        <div className="mt-10 flex items-start gap-14">
          <div className="min-w-0 flex-1">
            {host && (
              <>
                <DetailHead title="호스트" first />
                <HostBlock host={host} wide />
              </>
            )}
            <div className="mt-11">
              <DetailHead title="코스" aside={courseLength(t.stops, t.start, t.end)} first />
            </div>
            <StopList stops={t.stops} className="-mt-2" />
            <MapSketch count={t.stops.length} stops={t.stops} className="mt-4" />
            <div className="mt-8">
              <InfoRows rows={rows} wide />
            </div>
          </div>
          <div className="sticky top-6 w-[400px] flex-none">
            <div className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold">
                  {t.date} {t.start}
                </span>
                <Badge tone={statusTone(t.status)}>{t.status}</Badge>
              </div>
              <h1 className="mt-2 mb-0 text-[24px] leading-[31px] font-extrabold tracking-[-0.04em]">
                {t.title}
              </h1>
              <div className="mt-1.5 flex items-center gap-1 text-[13px] text-sub">
                <Icon name="pin" size={15} />
                핵심 장소 · {t.place} ({t.area})
              </div>
              <div className="mt-[18px]">
                {[
                  ['시간', `${t.start}–${t.end}`],
                  ['가는 길', `${t.from}에서 ${t.travel}`],
                  ['예상 비용', `${t.cost} 내외`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-t border-line py-[11px] text-[14px]">
                    <span className="text-sub">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-[18px] border-t border-line pt-[18px]">
                <div
                  className={`mb-2.5 text-[20px] font-extrabold tracking-[-0.03em] ${matched ? 'text-ink' : 'text-warn'}`}
                >
                  {headline}
                </div>
                <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
              </div>
              <Reason className="mt-4">{t.reason}</Reason>
              {notice && <Note className="mt-4">{notice}</Note>}
              <div className="mt-5 flex gap-2">
                <div className="grow">{cta()}</div>
                <ShareButton title={t.title} wide />
              </div>
              <div className="mt-3.5 text-center">
                <Link href={`/report?theme=${t.id}`} className="text-[12px] text-muted">
                  이 테마 신고하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}

/** 비로그인 안내 띠 */
function GuestBanner({ wide }: { wide?: boolean }) {
  return (
    <div
      className={
        wide
          ? 'hidden items-center justify-center gap-2.5 bg-ink px-8 py-3 text-[13px] text-white lg:flex'
          : 'flex items-center gap-2.5 bg-ink px-5 py-2.5 text-[13px] text-white'
      }
    >
      <span className={wide ? '' : 'grow'}>로그인 없이 보고 있어요. 신청하려면 가입이 필요해요.</span>
      <Link href="/login" className="font-bold text-white">
        가입
      </Link>
    </div>
  )
}

function Fact({
  label,
  value,
  grow = 1,
  divider,
}: {
  label: string
  value: string
  grow?: number
  divider?: boolean
}) {
  return (
    <div className={divider ? 'border-l border-line pl-4' : ''} style={{ flex: grow }}>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold tracking-[-0.03em]">{value}</div>
    </div>
  )
}
