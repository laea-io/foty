import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminHostRow, AdminReportRow } from '@/components/a/admin-row'
import { PageTitle } from '@/components/a/form'
import {
  AdminAttendanceRows,
  AdminNav,
  AdminPostRows,
  AdminThemeRows,
  AdminUserRows,
  UserSearch,
} from '@/components/admin/parts'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/server/auth'
import { adminAttendance, adminPosts, adminQueue, adminThemes, adminUsers } from '@/lib/server/q/a'

export const metadata: Metadata = { title: '운영팀' }

type SP = Promise<{ u?: string | string[] }>

async function load(u: string) {
  const [q, users, posts, themes, attendance] = await Promise.all([
    adminQueue(db),
    adminUsers(db, u),
    adminPosts(db),
    adminThemes(db),
    adminAttendance(db),
  ])
  return { q, users, posts, themes, attendance, u }
}
type D = Awaited<ReturnType<typeof load>>

/** 모바일 · 데스크톱이 한 페이지에 같이 있어서 id 뒤에 붙이는 글자(-d)로 나눈다 */
function Head({ d, sfx }: { d: D; sfx: string }) {
  const tabs = [
    { href: `#hosts${sfx}`, label: `할 일 ${d.q.openHosts + d.q.openReports + d.attendance.length}` },
    { href: `#hosts${sfx}`, label: '호스트' },
    { href: `#reports${sfx}`, label: '신고' },
    { href: `#attendance${sfx}`, label: '참여 검토' },
    { href: `#users${sfx}`, label: '사용자' },
    { href: `#community${sfx}`, label: '커뮤니티' },
    { href: `#themes${sfx}`, label: '테마' },
  ]
  return (
    <>
      <PageTitle sub="호스트 확인 · 신고 처리 · 사용자와 글 관리">운영팀</PageTitle>
      <div className="mt-4">
        <AdminNav items={tabs} />
      </div>
    </>
  )
}

function Group({
  id,
  title,
  open,
  sub,
  children,
}: {
  id: string
  title: string
  open?: number
  sub?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mt-[26px] mb-2 text-[17px] font-extrabold tracking-[-0.03em]">
        {title} {open !== undefined && <span className="font-medium text-muted">{open}</span>}
      </div>
      {sub && <p className="mt-0 mb-2 text-[12px] text-sub">{sub}</p>}
      {children}
    </section>
  )
}

const Hosts = ({ d, sfx }: { d: D; sfx: string }) => (
  <Group id={`hosts${sfx}`} title="호스트 확인" open={d.q.openHosts}>
    {d.q.hosts.map((it) => (
      <AdminHostRow key={it.id} it={it} />
    ))}
  </Group>
)

const Reports = ({ d, sfx }: { d: D; sfx: string }) => (
  <Group id={`reports${sfx}`} title="신고 처리" open={d.q.openReports} sub="검토 중인 신고를 먼저 보여 줘요">
    {d.q.reports.map((it) => (
      <AdminReportRow key={it.id} it={it} />
    ))}
    {!d.q.reports.length && (
      <div className="border-t border-line py-4 text-[13px] text-sub">들어온 신고가 없어요</div>
    )}
  </Group>
)

const Attendance = ({ d, sfx }: { d: D; sfx: string }) => (
  <Group
    id={`attendance${sfx}`}
    title="참여 기록 검토"
    open={d.attendance.length}
    sub="호스트 확인과 체크인 기록이 어긋난 참여자예요"
  >
    <AdminAttendanceRows rows={d.attendance} />
  </Group>
)

const Users = ({ d, sfx }: { d: D; sfx: string }) => (
  <Group id={`users${sfx}`} title="사용자" sub={d.u ? `“${d.u}” 검색 결과` : '최근 가입한 순서예요'}>
    <UserSearch q={d.u} anchor={`users${sfx}`} />
    <AdminUserRows users={d.users} />
  </Group>
)

const Community = ({ d, sfx }: { d: D; sfx: string }) => (
  <Group id={`community${sfx}`} title="커뮤니티" sub="숨긴 글·댓글은 커뮤니티에서 빠져요">
    <AdminPostRows posts={d.posts} />
  </Group>
)

const Themes = ({ d, sfx }: { d: D; sfx: string }) => (
  <Group id={`themes${sfx}`} title="테마 취소" sub="취소하면 신청자·참여자와 호스트에게 사유와 함께 알려요">
    <AdminThemeRows themes={d.themes} />
  </Group>
)

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin()
  const sp = await searchParams
  const u = (Array.isArray(sp.u) ? sp.u[0] : sp.u)?.slice(0, 80) ?? ''
  const d = await load(u)
  return (
    <>
      <MobileFrame>
        <BackBar title="운영팀" back="/my" />
        <div className="px-5 pb-10">
          <Head d={d} sfx="" />
          <Hosts d={d} sfx="" />
          <Reports d={d} sfx="" />
          <Attendance d={d} sfx="" />
          <Users d={d} sfx="" />
          <Community d={d} sfx="" />
          <Themes d={d} sfx="" />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <Head d={d} sfx="-d" />
        <div className="flex items-start gap-14">
          <div className="min-w-0 flex-1">
            <Hosts d={d} sfx="-d" />
            <Users d={d} sfx="-d" />
            <Themes d={d} sfx="-d" />
          </div>
          <div className="w-[520px] flex-none">
            <Reports d={d} sfx="-d" />
            <Attendance d={d} sfx="-d" />
            <Community d={d} sfx="-d" />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
