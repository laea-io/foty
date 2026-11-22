import type { Metadata } from 'next'
import Link from 'next/link'
import { announceAction, confirmScheduleAction } from '@/app/actions/c'
import { meetDetailAction } from '@/app/actions/host-edit'
import { TextInput } from '@/components/c/form'
import { ActionForm } from '@/components/host/action-form'
import { CoreTime } from '@/components/host/core-time'
import { type ProposalItem, Proposals } from '@/components/host/proposals'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { MapSketch, StopList } from '@/components/theme/parts'
import { Badge, Button, DemoNote, Note, Photo } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { memberIds } from '@/lib/server/domain/flow'
import { changesOf } from '@/lib/server/q/c'
import { ownTheme } from '@/lib/server/q/own'
import type { ThemeView } from '@/lib/server/q/themes'
import { dday } from '@/lib/server/time'

export const metadata: Metadata = { title: '호스트 — 일정 편집' }

async function Body({ t, sfx }: { t: ThemeView; sfx: string }) {
  const core = t.stops.find((s) => s.fixed) ?? t.stops[0]
  const changes = await changesOf(t.id)
  // 확인할 사람 = 호스트 + 수락된 참여자(친구 자리 수가 아니라 사람 수)
  const group = (await memberIds(db, t.id)).length + 1
  const items: ProposalItem[] = changes.map((c) => ({
    id: c.id,
    who: `${c.who} · ${c.source === 'AI 대안' ? 'AI 대안에서 제안' : '직접 제안'}`,
    what: c.label,
    from: c.fromText,
    to: c.toText,
    status: c.status,
    major: c.major,
    confirm: c.major ? `${c.who} 제안 · ${c.confirmed} / ${group}명 확인` : undefined,
  }))
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-bold">
          {dday(t.day)}{' '}
          <span className="font-normal text-sub">
            · {t.date} {t.start}
          </span>
        </span>
        <Badge tone={t.status === '일정 확정' ? 'ink' : 'soft'}>{t.status}</Badge>
        <Badge tone="ink">호스트</Badge>
      </div>
      <h1 className="mt-2 mb-0 text-[23px] leading-[30px] font-extrabold tracking-[-0.05em]">{t.title}</h1>
      {t.meetDetail && <div className="mt-1.5 text-[13px] text-sub">집결 {t.meetDetail}</div>}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link href={`/themes/${t.id}`} className="text-sub">
          테마 보기
        </Link>
        {t.status !== '취소' && t.status !== '여행 완료' && (
          <>
            <Link href={`/host/themes/${t.id}/edit`} className="text-sub">
              테마 정보 고치기
            </Link>
            <Link href={`/host/themes/${t.id}/applicants`} className="text-sub">
              신청자
            </Link>
            <Link href={`/host/themes/${t.id}/cancel`} className="text-warn">
              테마 취소
            </Link>
          </>
        )}
      </div>
      {t.matched && t.status !== '취소' && t.status !== '여행 완료' && (
        <ActionForm id={`meet-${sfx}`} action={meetDetailAction} className="mt-6" resetOnDone>
          <input type="hidden" name="theme" value={t.id} />
          <label htmlFor={`meet-${sfx}-input`} className="mb-2 block text-[13px] font-semibold">
            집결 장소·시간 {t.meetDetail ? '바꾸기' : '정하기'}
          </label>
          <div className="flex gap-2">
            <TextInput
              id={`meet-${sfx}-input`}
              name="meet"
              placeholder="예: 운길산역 1번 출구 앞, 10:20"
              defaultValue={t.meetDetail ?? ''}
              maxLength={120}
            />
            <Button type="submit" variant="outline" className="h-[50px] flex-none">
              알리기
            </Button>
          </div>
          <div className="mt-1.5 text-[12px] text-muted">참여자에게 알림이 가고 대화에도 남아요.</div>
        </ActionForm>
      )}

      <h2 className="mt-7 mb-3 text-[18px] font-extrabold tracking-[-0.04em]">핵심 장소</h2>
      {core && (
        <div className="flex items-center gap-3 rounded-[16px] bg-face px-4 py-3.5">
          <Photo
            src={core.image.src}
            alt={core.image.alt}
            bg={core.image.bg}
            className="h-[52px] w-[52px] rounded-[14px]"
          />
          <div className="min-w-0 grow">
            <div className="flex items-center gap-1.5">
              <span className="min-w-0 truncate text-[15px] font-bold">{core.name}</span>
              <Badge tone="ink">고정</Badge>
            </div>
            <div className="mt-0.5 text-[12px] text-sub">
              {core.time} · {core.stay} · 호스트만 바꿀 수 있어요
            </div>
          </div>
          <CoreTime themeId={t.id} from={core.time} />
        </div>
      )}

      <Proposals themeId={t.id} items={items} />

      <div className="mt-[30px] mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">일정 버전 {t.scheduleVersion}</h2>
        <Link href={`/trips/${t.id}/history`} className="text-[12px] text-sub no-underline">
          변경 이력 {changes.filter((c) => c.status === '반영됨').length}
        </Link>
      </div>
      <StopList stops={t.stops} className="-mt-2" />
      <Note className="mt-4">
        핵심 장소의 시간을 바꾸면 주요 변경이라 모든 참여자에게 확인 요청이 가요. 나머지 구간은 반영만 하면
        끝나요.
      </Note>
      <ActionForm id={`announce-${sfx}`} action={announceAction} className="mt-6" resetOnDone>
        <input type="hidden" name="theme" value={t.id} />
        <label htmlFor={`announce-${sfx}-input`} className="mb-2 block text-[13px] font-semibold">
          참여자에게 공지
        </label>
        <div className="flex gap-2">
          <TextInput
            id={`announce-${sfx}-input`}
            name="body"
            placeholder="예: 내일 비 소식이 있어요. 우산 챙겨 주세요."
            required
          />
          <Button type="submit" variant="outline" className="h-[50px]">
            보내기
          </Button>
        </div>
      </ActionForm>
    </>
  )
}

export default async function HostSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await ownTheme(id, `/host/themes/${id}/space`)
  const canConfirm = t.matched && (t.status === '일정 조율 중' || t.status === '모집 마감')
  const confirm = (form: string) => (
    <ActionForm id={form} action={confirmScheduleAction}>
      <input type="hidden" name="theme" value={t.id} />
      <Button type="submit" size="lg" block disabled={!canConfirm}>
        {t.status === '일정 확정'
          ? '일정이 확정됐어요'
          : canConfirm
            ? '일정 확정하기'
            : t.status === '모집 중'
              ? '모집 마감 뒤에 확정할 수 있어요'
              : '일정 확정하기'}
      </Button>
    </ActionForm>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="그룹 여행 공간" back="/host" />
        <div className="px-5">
          <Body t={t} sfx="m" />
          <DemoNote />
        </div>
        <BottomBar>
          <Link
            href={`/trips/${t.id}/chat`}
            className="inline-flex h-[54px] items-center rounded-[14px] px-[18px] text-[15px] font-semibold text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-line-2)]"
          >
            대화
          </Link>
          <div className="grow">{confirm('confirm-m')}</div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start gap-10">
          <div className="min-w-0 flex-1">
            <Body t={t} sfx="d" />
            <div className="mt-6 flex gap-2">
              <Link
                href={`/trips/${t.id}/chat`}
                className="inline-flex h-[54px] flex-none items-center rounded-[14px] px-[18px] text-[15px] font-semibold text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-line-2)]"
              >
                대화
              </Link>
              <div className="grow">{confirm('confirm-d')}</div>
            </div>
          </div>
          <div className="sticky top-6 w-[520px] flex-none">
            <MapSketch count={t.stops.length} stops={t.stops} height={560} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
