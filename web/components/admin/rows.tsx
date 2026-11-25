import Link from 'next/link'
import { adminHostAction, adminHostSuspendAction, adminReportAction } from '@/app/actions/admin'
import { ReasonInput } from '@/components/admin/parts'
import { ActionForm, FormError } from '@/components/forms/action-form'
import { Avatar, Badge, Button, ButtonLink } from '@/components/ui/primitives'
import type { AdminHost, AdminReport } from '@/lib/server/queries/admin'

function Head({ name, line, badge }: { name: string; line: string; badge: AdminHost['badge'] }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size={40} />
      <div className="min-w-0 grow">
        <div className="text-[15px] font-bold">{name}</div>
        <div className="mt-0.5 text-[12px] text-sub">{line}</div>
      </div>
      <Badge tone={badge[0]}>{badge[1]}</Badge>
    </div>
  )
}

/** 신청 내용 — 종류 · 이름 · 지역 · 소개 · 연락 · 제출 시각 */
function Details({ it }: { it: AdminHost }) {
  const rows: [string, string][] = [
    ['종류', it.kind],
    ['이름', it.name],
    ['지역', it.area],
    ['소개', it.intro || '적지 않았어요'],
    ['연락', it.contact || '적지 않았어요'],
    ['제출', it.submitted],
  ]
  return (
    <dl className="mt-3 mb-0 grid grid-cols-[44px_1fr] gap-x-3 gap-y-1.5 rounded-[14px] bg-face px-4 py-3 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="m-0 break-words whitespace-pre-line text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** 호스트 확인 한 줄 — 확인 대기·보류면 [확인 완료 | 보류(사유 필수)], 확인 완료면 [테마 보기 | 정지], 정지면 [정지 해제] */
export function AdminHostRow({ it }: { it: AdminHost }) {
  return (
    <div className="border-t border-line py-4">
      <Head name={it.name} line={it.line} badge={it.badge} />
      {it.pending && <Details it={it} />}
      {it.pending ? (
        <ActionForm action={adminHostAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="hostId" value={it.id} />
          <ReasonInput name="reason" placeholder="보류 사유(보류할 때만 · 호스트에게 그대로 전해져요)" />
          <FormError />
          <div className="flex gap-2">
            <Button type="submit" name="ok" value="1" size="sm" className="flex-1">
              확인 완료
            </Button>
            <Button type="submit" name="ok" value="0" variant="outline" size="sm" className="flex-1">
              {it.status === '보류' ? '사유 다시 보내기' : '보류'}
            </Button>
          </div>
        </ActionForm>
      ) : it.status === '정지' ? (
        <ActionForm action={adminHostSuspendAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="hostId" value={it.id} />
          <FormError />
          <div className="flex gap-2">
            <ButtonLink href={`/hosts/${it.id}`} variant="outline" size="sm" className="flex-1">
              테마 {it.themes}개 보기
            </ButtonLink>
            <Button type="submit" name="on" value="0" size="sm" className="flex-1">
              정지 해제
            </Button>
          </div>
        </ActionForm>
      ) : (
        <details className="mt-3">
          <summary className="flex cursor-pointer list-none gap-2">
            <ButtonLink href={`/hosts/${it.id}`} variant="outline" size="sm" className="flex-1">
              테마 {it.themes}개 보기
            </ButtonLink>
            <span className="inline-flex h-11 flex-1 items-center justify-center rounded-full text-[13px] font-semibold text-sub shadow-[inset_0_0_0_1px_var(--color-line-2)]">
              정지…
            </span>
          </summary>
          <ActionForm action={adminHostSuspendAction} className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="hostId" value={it.id} />
            <ReasonInput name="reason" placeholder="정지 사유(호스트에게 전해져요)" />
            <p className="m-0 text-[12px] text-sub">모집 중 테마는 그대로 두고, 새 테마를 열 수 없게 해요</p>
            <FormError />
            <Button type="submit" name="on" value="1" variant="outline" size="sm" block>
              호스트 권한 정지
            </Button>
          </ActionForm>
        </details>
      )}
    </div>
  )
}

/** 신고 한 줄 — 검토 중이면 [불참 확인(처리 완료) | 반려], 끝난 신고는 기록 보기. 대상·신고한 사람 바로 가기 */
export function AdminReportRow({ it }: { it: AdminReport }) {
  return (
    <div className="border-t border-line py-4">
      <Head name={it.name} line={it.line} badge={it.badge} />
      {it.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          {it.links.map((l) => (
            <Link key={l.href + l.label} href={l.href} className="text-sub underline underline-offset-2">
              {l.label}
            </Link>
          ))}
        </div>
      )}
      {it.open ? (
        <ActionForm action={adminReportAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="reportId" value={it.id} />
          <FormError />
          <div className="flex gap-2">
            <Button type="submit" name="done" value="1" size="sm" className="flex-1">
              {it.doneLabel}
            </Button>
            <Button type="submit" name="done" value="0" variant="outline" size="sm" className="flex-1">
              반려
            </Button>
          </div>
        </ActionForm>
      ) : (
        <div className="mt-3 flex gap-2">
          <ButtonLink href={it.href} variant="outline" size="sm" className="flex-1">
            기록 보기
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
