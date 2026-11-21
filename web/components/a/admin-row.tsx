import { adminHostAction, adminReportAction } from '@/app/actions/a'
import { Avatar, Badge, Button, ButtonLink } from '@/components/ui/primitives'
import type { AdminHost, AdminReport } from '@/lib/server/q/a'

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

/** 호스트 확인 한 줄 — 확인 대기·보류면 [확인 완료 | 보류], 끝난 곳은 테마 보기 */
export function AdminHostRow({ it }: { it: AdminHost }) {
  return (
    <div className="border-t border-line py-4">
      <Head name={it.name} line={it.line} badge={it.badge} />
      {it.pending ? (
        <form action={adminHostAction} className="mt-3 flex gap-2">
          <input type="hidden" name="hostId" value={it.id} />
          <Button type="submit" name="ok" value="1" size="sm" className="flex-1">
            확인 완료
          </Button>
          {it.badge[1] !== '보류' && (
            <Button type="submit" name="ok" value="0" variant="outline" size="sm" className="flex-1">
              보류
            </Button>
          )}
        </form>
      ) : (
        <div className="mt-3 flex gap-2">
          <ButtonLink href={`/hosts/${it.id}`} variant="outline" size="sm" className="flex-1">
            테마 {it.themes}개 보기
          </ButtonLink>
        </div>
      )}
    </div>
  )
}

/** 신고 한 줄 — 검토 중이면 [불참 확인(처리 완료) | 반려], 끝난 신고는 기록 보기 */
export function AdminReportRow({ it }: { it: AdminReport }) {
  return (
    <div className="border-t border-line py-4">
      <Head name={it.name} line={it.line} badge={it.badge} />
      {it.open ? (
        <form action={adminReportAction} className="mt-3 flex gap-2">
          <input type="hidden" name="reportId" value={it.id} />
          <Button type="submit" name="done" value="1" size="sm" className="flex-1">
            {it.doneLabel}
          </Button>
          <Button type="submit" name="done" value="0" variant="outline" size="sm" className="flex-1">
            반려
          </Button>
        </form>
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
