import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { H2 } from '@/components/a/form'
import { StateButton } from '@/components/a/state-button'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow, ThemeTile } from '@/components/theme/cards'
import { Avatar, ButtonLink, DemoNote, Verified } from '@/components/ui/primitives'
import { type Host, hostById, hosts } from '@/lib/demo/people'
import { hostTags } from '@/lib/demo/profiles'
import { themes } from '@/lib/demo/themes'

export function generateStaticParams() {
  return hosts.map((h) => ({ id: h.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const h = hostById((await params).id)
  return { title: h ? `${h.name} · 호스트` : '호스트' }
}

const openish = (s: string) => s === '모집 중' || s === '일정 조율 중'

function Stats({ h, card }: { h: Host; card?: boolean }) {
  const open = themes.filter((t) => t.hostId === h.id && openish(t.status)).length
  return (
    <div className={`mt-5 flex border-t border-line text-center ${card ? 'pt-4' : 'border-b py-4'}`}>
      <div className="flex-1">
        <div className="text-[18px] font-extrabold">{h.hosted}회</div>
        <div className="text-[12px] text-sub">진행한 테마</div>
      </div>
      <div className="flex-1 border-l border-line">
        <div className="text-[18px] font-extrabold">{open}개</div>
        <div className="text-[12px] text-sub">모집 중</div>
      </div>
    </div>
  )
}

function Tags({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {hostTags(id).map(([t, n]) => (
        <span
          key={t}
          className="inline-flex h-11 items-center rounded-full bg-face px-4 text-[15px] font-medium text-label"
        >
          {t} {n}
        </span>
      ))}
    </div>
  )
}

const caution = (h: Host) =>
  h.kind === 'resident'
    ? '인증 표시는 남양주 주민이라는 사실만 알려줘요. 안전을 보장하는 표시는 아니에요.'
    : '인증 표시는 사업장이 확인됐다는 사실만 알려줘요. 안전을 보장하는 표시는 아니에요.'

export default async function HostProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const h = hostById((await params).id)
  if (!h) notFound()
  const list = themes.filter((t) => t.hostId === h.id)
  const back = list[0] ? `/themes/${list[0].id}` : '/'
  const report = list[0] ? `/report?theme=${list[0].id}` : '/report'
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="호스트" back={back} />
        <div className="px-5">
          <div className="flex flex-col items-center pt-4 text-center">
            <Avatar name={h.name} size={88} />
            <div className="mt-3 text-[22px] font-extrabold tracking-[-0.04em]">{h.name}</div>
            <div className="mt-1.5">
              <Verified kind={h.kind} />
            </div>
            <p className="mt-3 mb-0 text-[15px] leading-[23px] text-[#2a2d34]">{h.intro}</p>
          </div>
          <Stats h={h} />
          {hostTags(h.id).length > 0 && (
            <>
              <div className="mt-[26px] mb-2.5 text-[14px] font-semibold">참여자들이 남긴 태그</div>
              <Tags id={h.id} />
            </>
          )}
          <div className="mt-[30px]">
            <H2 first>열려 있는 테마</H2>
          </div>
          <div className="-mt-2">
            {list.map((t) => (
              <ThemeRow key={t.id} t={t} />
            ))}
          </div>
          <div className="mt-4 text-[12px] leading-[18px] text-muted">{caution(h)}</div>
        </div>
        <DemoNote />
        <BottomBar>
          <ButtonLink href={report} variant="outline" size="lg" icon="flag">
            신고
          </ButtonLink>
          <div className="grow">
            <StateButton
              variant="primary"
              size="lg"
              icon="bell"
              onIcon="check"
              off="새 테마 알림 받기"
              on="새 테마가 열리면 알려드려요"
              block
            />
          </div>
        </BottomBar>
      </MobileFrame>

      <DesktopFrame>
        <div className="flex items-start gap-14">
          <div className="w-[360px] flex-none">
            <div className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <div className="flex flex-col items-center text-center">
                <Avatar name={h.name} size={96} />
                <div className="mt-3.5 text-[24px] font-extrabold tracking-[-0.04em]">{h.name}</div>
                <div className="mt-1.5">
                  <Verified kind={h.kind} />
                </div>
                <p className="mt-3.5 mb-0 text-[15px] leading-[23px] text-[#2a2d34]">{h.intro}</p>
              </div>
              <Stats h={h} card />
              <div className="mt-5 flex gap-2">
                <div className="grow">
                  <StateButton
                    variant="primary"
                    size="md"
                    icon="bell"
                    onIcon="check"
                    off="새 테마 알림 받기"
                    on="알림을 받고 있어요"
                    block
                  />
                </div>
                <ButtonLink href={report} variant="outline" icon="flag">
                  신고
                </ButtonLink>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {hostTags(h.id).length > 0 && (
              <>
                <div className="mb-3 text-[18px] font-extrabold tracking-[-0.03em]">참여자들이 남긴 태그</div>
                <Tags id={h.id} />
              </>
            )}
            <div className="mt-9 mb-4 text-[18px] font-extrabold tracking-[-0.03em]">열려 있는 테마</div>
            <div className="grid grid-cols-2 gap-6">
              {list.map((t) => (
                <ThemeTile key={t.id} t={t} />
              ))}
            </div>
            <div className="mt-6 text-[13px] text-muted">{caution(h)}</div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
