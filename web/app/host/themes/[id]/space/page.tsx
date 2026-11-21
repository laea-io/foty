import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Proposals } from '@/components/host/proposals'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { MapSketch, StopList } from '@/components/theme/parts'
import { Badge, Button, DemoNote, Note, Photo } from '@/components/ui/primitives'
import { type Theme, themeById } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '호스트 — 일정 편집' }

function Body({ t }: { t: Theme }) {
  const core = t.stops.find((s) => s.fixed) ?? t.stops[0]
  const third = t.stops[2] ?? t.stops[t.stops.length - 1]
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-bold">
          D-1{' '}
          <span className="font-normal text-sub">
            · {t.date} {t.start}
          </span>
        </span>
        <Badge>일정 조율 중</Badge>
        <Badge tone="ink">호스트</Badge>
      </div>
      <h1 className="mt-2 mb-0 text-[23px] leading-[30px] font-extrabold tracking-[-0.05em]">{t.title}</h1>

      <h2 className="mt-7 mb-3 text-[18px] font-extrabold tracking-[-0.04em]">핵심 장소</h2>
      <div className="flex items-center gap-3 rounded-[16px] bg-face px-4 py-3.5">
        <Photo
          src={core.image.src}
          alt={core.image.alt}
          bg={core.image.bg}
          className="h-[52px] w-[52px] rounded-[14px]"
        />
        <div className="grow">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold">{core.name}</span>
            <Badge tone="ink">고정</Badge>
          </div>
          <div className="mt-0.5 text-[12px] text-sub">
            {core.time} · {core.stay} · 호스트만 바꿀 수 있어요
          </div>
        </div>
        <button type="button" className="border-0 bg-transparent text-[13px] font-semibold underline">
          시간 바꾸기
        </button>
      </div>

      <Proposals
        items={[
          {
            id: 'third',
            who: '유나 · AI 대안에서 제안',
            what: '세 번째 장소',
            from: third.name,
            to: '두부 전문점',
            status: '제안됨',
          },
          {
            id: 'meet',
            who: '',
            confirm: '내가 제안 · 3 / 5명 확인',
            what: '집결 시간',
            from: '08:40',
            to: '08:20',
            status: '변경 확인 중',
          },
        ]}
      />

      <div className="mt-[30px] mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">일정 버전 3</h2>
        <Link href={`/trips/${t.id}/history`} className="text-[12px] text-sub no-underline">
          변경 이력
        </Link>
      </div>
      <StopList stops={t.stops} className="-mt-2" />
      <Note className="mt-4">
        핵심 장소의 시간을 바꾸면 주요 변경이라 모든 참여자에게 확인 요청이 가요. 나머지 구간은 반영만 하면
        끝나요.
      </Note>
    </>
  )
}

export default async function HostSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const t = themeById((await params).id)
  if (!t) notFound()
  const buttons = (
    <>
      <Button variant="outline" size="lg">
        참여자에게 공지
      </Button>
      <div className="grow">
        <Button size="lg" block>
          일정 확정하기
        </Button>
      </div>
    </>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="그룹 여행 공간" back="/host" />
        <div className="px-5">
          <Body t={t} />
          <DemoNote />
        </div>
        <BottomBar>{buttons}</BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start gap-10">
          <div className="min-w-0 flex-1">
            <Body t={t} />
            <div className="mt-6 flex gap-2">{buttons}</div>
          </div>
          <div className="sticky top-6 w-[520px] flex-none">
            <MapSketch count={t.stops.length} height={560} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
