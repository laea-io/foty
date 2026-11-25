import Link from 'next/link'
import {
  adminAttendanceAction,
  adminCancelThemeAction,
  adminHideAction,
  adminUserSuspendAction,
} from '@/app/actions/admin'
import { AdminResetLink } from '@/components/auth/reset-forms'
import { ActionForm, FormError } from '@/components/forms/action-form'
import { Badge, Button } from '@/components/ui/primitives'
import type { AdminPost, AdminUser } from '@/lib/server/queries/admin'

// 운영팀 화면 부품 — 사용자 · 커뮤니티 · 테마 취소 · 참여 기록 검토

/** 사유 한 줄 입력(회색 칸) */
export function ReasonInput({
  name,
  placeholder,
  required,
}: {
  name: string
  placeholder: string
  required?: boolean
}) {
  return (
    <input
      name={name}
      required={required}
      maxLength={300}
      placeholder={placeholder}
      className="h-11 w-full rounded-[12px] border-0 bg-face px-3.5 text-[14px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink"
    />
  )
}

/** 운영팀 화면 안 이동(가로로 넘기는 칩) */
export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav className="-mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
      {items.map((it, i) => (
        <a
          key={it.label}
          href={it.href}
          className={`inline-flex h-9 flex-none items-center rounded-full px-3.5 text-[13px] no-underline ${
            i === 0 ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'
          }`}
        >
          {it.label}
        </a>
      ))}
    </nav>
  )
}

const Empty = ({ children }: { children: string }) => (
  <div className="border-t border-line py-4 text-[13px] text-sub">{children}</div>
)

/** 사용자 찾기 폼(GET ?u=) */
export function UserSearch({ q, anchor }: { q: string; anchor: string }) {
  return (
    <form action={`/admin#${anchor}`} method="get" className="mb-2 flex gap-2">
      <input
        name="u"
        defaultValue={q}
        placeholder="handle · 이름 · 이메일"
        className="h-11 min-w-0 grow rounded-[12px] border-0 bg-face px-3.5 text-[14px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink"
      />
      <Button type="submit" variant="outline" size="sm">
        찾기
      </Button>
    </form>
  )
}

export function AdminUserRows({ users }: { users: AdminUser[] }) {
  if (!users.length) return <Empty>찾는 사용자가 없어요</Empty>
  return users.map((u) => (
    <div key={u.id} className="border-t border-line py-3.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 grow">
          <div className="text-[15px] font-bold">
            {u.deleted ? (
              u.name
            ) : (
              <Link href={`/users/${u.handle}`} className="text-ink no-underline">
                {u.name}
              </Link>
            )}{' '}
            <span className="text-[12px] font-medium text-muted">@{u.handle}</span>
          </div>
          <div className="mt-0.5 text-[12px] break-all text-sub">
            {[u.email ?? (u.kakao ? '카카오 계정' : null), `${u.created} 가입`].filter(Boolean).join(' · ')}
          </div>
        </div>
        {u.role === 'admin' && <Badge tone="ink">운영팀</Badge>}
        {u.deleted ? <Badge tone="muted">탈퇴</Badge> : u.suspended ? <Badge tone="warn">정지</Badge> : null}
      </div>
      {u.role !== 'admin' && !u.deleted && (
        <ActionForm action={adminUserSuspendAction} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="userId" value={u.id} />
          <FormError />
          <Button
            type="submit"
            name="on"
            value={u.suspended ? '0' : '1'}
            variant={u.suspended ? 'primary' : 'outline'}
            size="sm"
            block
          >
            {u.suspended ? '정지 해제' : '정지(로그인 막기 · 세션 끝내기)'}
          </Button>
        </ActionForm>
      )}
      {!u.deleted && !u.suspended && <AdminResetLink userId={u.id} />}
    </div>
  ))
}

function HideForm({ kind, id, hidden }: { kind: 'post' | 'comment'; id: string; hidden: boolean }) {
  return (
    <ActionForm action={adminHideAction} className="flex flex-none flex-col items-end gap-1">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        name="on"
        value={hidden ? '0' : '1'}
        variant={hidden ? 'primary' : 'outline'}
        size="sm"
      >
        {hidden ? '다시 보이기' : '숨기기'}
      </Button>
      <FormError className="text-right" />
    </ActionForm>
  )
}

export function AdminPostRows({ posts }: { posts: AdminPost[] }) {
  if (!posts.length) return <Empty>글이 없어요</Empty>
  return posts.map((p) => (
    <div key={p.id} className="border-t border-line py-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 grow">
          <div className={`text-[15px] font-bold ${p.hidden ? 'text-muted line-through' : ''}`}>
            {p.hidden ? (
              p.title
            ) : (
              <Link href={`/community/${p.id}`} className="text-ink no-underline">
                {p.title}
              </Link>
            )}
          </div>
          <div className="mt-0.5 text-[12px] text-sub">
            {[p.kind, p.author, p.when, p.hidden ? '숨김' : null].filter(Boolean).join(' · ')}
          </div>
        </div>
        <HideForm kind="post" id={p.id} hidden={p.hidden} />
      </div>
      {p.comments.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2 border-l-2 border-line pl-3">
          {p.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <div
                className={`min-w-0 grow text-[13px] ${c.hidden ? 'text-muted line-through' : 'text-ink'}`}
              >
                <span className="font-semibold">{c.author}</span> {c.body}
                <span className="ml-1 text-[11px] text-muted no-underline">{c.when}</span>
              </div>
              <HideForm kind="comment" id={c.id} hidden={c.hidden} />
            </div>
          ))}
        </div>
      )}
    </div>
  ))
}

export function AdminThemeRows({ themes }: { themes: { id: string; title: string; line: string }[] }) {
  if (!themes.length) return <Empty>진행 중인 테마가 없어요</Empty>
  return themes.map((t) => (
    <details key={t.id} className="border-t border-line py-3.5">
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <div className="min-w-0 grow">
          <div className="text-[15px] font-bold">{t.title}</div>
          <div className="mt-0.5 text-[12px] text-sub">{t.line}</div>
        </div>
        <span className="text-[13px] font-semibold text-sub">취소…</span>
      </summary>
      <ActionForm action={adminCancelThemeAction} className="mt-2.5 flex flex-col gap-2">
        <input type="hidden" name="themeId" value={t.id} />
        <ReasonInput name="reason" placeholder="취소 사유(참여자·호스트에게 전해져요)" required />
        <FormError />
        <div className="flex gap-2">
          <Link
            href={`/themes/${t.id}`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full text-[13px] font-semibold text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-line-2)]"
          >
            테마 보기
          </Link>
          <Button type="submit" size="sm" className="flex-1">
            운영팀 취소
          </Button>
        </div>
      </ActionForm>
    </details>
  ))
}

export function AdminAttendanceRows({
  rows,
}: {
  rows: { themeId: string; userId: string; title: string; name: string; handle: string; line: string }[]
}) {
  if (!rows.length) return <Empty>검토할 참여 기록이 없어요</Empty>
  return rows.map((r) => (
    <div key={`${r.themeId}-${r.userId}`} className="border-t border-line py-3.5">
      <div className="text-[15px] font-bold">
        <Link href={`/users/${r.handle}`} className="text-ink no-underline">
          {r.name}
        </Link>{' '}
        <span className="text-[13px] font-medium text-sub">·</span>{' '}
        <Link href={`/themes/${r.themeId}`} className="text-[14px] font-semibold text-sub no-underline">
          {r.title}
        </Link>
      </div>
      <div className="mt-0.5 text-[12px] text-sub">{r.line}</div>
      <ActionForm action={adminAttendanceAction} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="themeId" value={r.themeId} />
        <input type="hidden" name="userId" value={r.userId} />
        <FormError />
        <div className="flex gap-2">
          <Button type="submit" name="ok" value="1" size="sm" className="flex-1">
            참여 확인
          </Button>
          <Button type="submit" name="ok" value="0" variant="outline" size="sm" className="flex-1">
            불참 확인
          </Button>
        </div>
      </ActionForm>
    </div>
  ))
}
