import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PageTitle } from '@/components/a/form'
import { StampCell } from '@/components/a/stamps'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { StopList } from '@/components/theme/parts'
import {
  Avatar,
  Badge,
  type BadgeTone,
  Button,
  ButtonLink,
  Chip,
  Progress,
  Reason,
  Tag,
  Verified,
} from '@/components/ui/primitives'
import { personById } from '@/lib/demo/people'
import { cellFor, placeById, type StampPlace } from '@/lib/demo/stamps'
import { type Theme, themeById } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '재사용 컴포넌트' }

const themeBadges: [BadgeTone, string][] = [
  ['soft', '모집 중'],
  ['ink', '성사'],
  ['warn', '성사까지 1명'],
  ['soft', '모집 마감'],
  ['soft', '일정 조율 중'],
  ['ink', '일정 확정'],
  ['soft', '여행 완료'],
  ['muted', '취소'],
]
const flowBadges: [BadgeTone, string][] = [
  ['warn', '신청 대기'],
  ['ink', '수락'],
  ['muted', '거절'],
  ['soft', '제안됨'],
  ['warn', '변경 확인 중'],
  ['ink', '반영됨'],
  ['muted', '반려됨'],
  ['ink', '참여 확인'],
  ['warn', '검토 중'],
  ['ink', '고정'],
  ['warn', '재확인 필요'],
]
const swatches: [string, string][] = [
  ['#0b0d12', '검정'],
  ['#ffffff', '흰색'],
  ['#f3f4f5', '면'],
  ['#5b5f69', '보조 글자'],
  ['#ff6a3d', '심볼 색'],
]

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="break-inside-avoid border-t border-line py-[22px]">
      <div className="mb-3 text-[12px] font-bold text-sub">{title}</div>
      {children}
    </div>
  )
}

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-1.5">{children}</div>
)

function RecordBlock({ id }: { id: string }) {
  const p = personById(id)
  if (!p) return null
  return (
    <div className="flex gap-3 border-t border-line py-4">
      <Avatar name={p.name} size={44} />
      <div className="min-w-0 grow">
        <div className="text-[15px] font-bold">{p.name}</div>
        <div className="mt-0.5 text-[12px] text-sub">
          {p.from} 출발{p.trips ? ` · 동행 ${p.trips}회` : ''}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {p.trips ? p.tags.map((t) => <Tag key={t}>{t}</Tag>) : <Tag>첫 동행이에요</Tag>}
        </div>
      </div>
    </div>
  )
}

function Sections() {
  const t = themeById('dasan-lunch') as Theme
  const cells = ['dumulmeori', 'gwangneung', 'paldang-view'].map((id) => cellFor(placeById(id) as StampPlace))
  return (
    <>
      <Block title="선택 칩">
        <Row>
          <Chip selected>산책</Chip>
          <Chip>카페</Chip>
          <Chip selected icon="pin">
            상봉역 출발
          </Chip>
        </Row>
      </Block>
      <Block title="버튼">
        <Row>
          <Button variant="accent">참여 신청</Button>
          <Button>그룹 공간 열기</Button>
          <ButtonLink href={`/themes/${t.id}/cancel-done`} variant="outline">
            신청 취소
          </ButtonLink>
          <Button variant="soft" size="sm">
            코스에 제안
          </Button>
        </Row>
      </Block>
      <Block title="상태 배지 — 테마">
        <Row>
          {themeBadges.map(([tone, l]) => (
            <Badge key={l} tone={tone}>
              {l}
            </Badge>
          ))}
        </Row>
      </Block>
      <Block title="상태 배지 — 신청·변경·참여">
        <Row>
          {flowBadges.map(([tone, l]) => (
            <Badge key={l} tone={tone}>
              {l}
            </Badge>
          ))}
        </Row>
      </Block>
      <Block title="테마 카드 (목록형)">
        <div className="-my-3.5">
          <ThemeRow t={t} />
        </div>
      </Block>
      <Block title="성사 진행 표시">
        <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
      </Block>
      <Block title="호스트 인증 표시 · 추천 이유">
        <Row>
          <Verified kind="business" />
          <Verified kind="resident" />
        </Row>
        <Reason className="mt-3">날짜가 맞고, 여유로운 산책을 선호해요</Reason>
      </Block>
      <Block title="장소 카드">
        <StopList stops={[t.stops[0], t.stops[1], t.stops[3]]} className="-my-3.5" />
      </Block>
      <Block title="확인 요청 카드">
        <div className="rounded-[16px] bg-face px-[18px] pt-4 pb-[18px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-warn">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              변경 확인 중 · 집결 시간
            </span>
            <span className="text-[12px] text-sub">3 / 5명 확인</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[16px] text-muted line-through">08:40</span>
            <span className="text-[26px] font-extrabold tracking-[-0.04em]">08:20</span>
            <span className="text-[12px] text-sub">상봉역 · 호스트 하린</span>
          </div>
          <div className="mt-2 text-[11px] text-sub">
            확인: 하린 · 유나 · 지호 <span className="text-muted">| 아직: 도현 · 강현</span>
          </div>
          <div className="mt-3.5 flex gap-2">
            <ButtonLink href="/trips/gwangneung-morning/history" size="sm" className="flex-1">
              확인했어요
            </ButtonLink>
            <Button variant="outline" size="sm" className="flex-1">
              의견 남기기
            </Button>
          </div>
        </div>
      </Block>
      <Block title="동행 기록 블록">
        <RecordBlock id="yuna" />
        <RecordBlock id="kanghyun" />
      </Block>
      <Block title="스탬프">
        <div className="grid max-w-[330px] grid-cols-3 gap-2">
          {cells.map((c) => (
            <StampCell key={c.id} c={c} />
          ))}
        </div>
      </Block>
      <Block title="시연 데이터 표시">
        <div className="text-left text-[11px] text-muted">화면의 호스트·일정·금액은 시연용 예시예요</div>
      </Block>
      <Block title="색 · 글자">
        <div className="flex gap-2">
          {swatches.map(([c, l]) => (
            <div key={l} className="flex-1">
              <div
                className="h-11 rounded-[12px] shadow-[inset_0_0_0_1px_var(--color-line)]"
                style={{ background: c }}
              />
              <div className="mt-1.5 text-[11px] text-sub">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[22px] font-extrabold tracking-[-0.04em]">Wanted Sans 제목 22</div>
        <div className="mt-1 text-[15px]">본문 15 · 보조 13 · 작은 글자 11</div>
      </Block>
    </>
  )
}

export default function ComponentsPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="컴포넌트" back="/my" />
        <div className="px-5 pb-10">
          <PageTitle sub="화면 전체에서 같은 모양으로 쓰는 부품이에요.">재사용 컴포넌트</PageTitle>
          <div className="mt-[18px]">
            <Sections />
          </div>
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[1040px]">
          <PageTitle sub="화면 전체에서 같은 모양으로 쓰는 부품이에요.">재사용 컴포넌트</PageTitle>
          <div className="mt-[18px] columns-2 gap-16">
            <Sections />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
