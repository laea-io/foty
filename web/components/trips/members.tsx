import Link from 'next/link'
import { BlockButton } from '@/components/trips/forms'
import { displayName, type Member, type SpaceData } from '@/components/trips/types'
import { Icon, type IconName } from '@/components/ui/icon'
import { Avatar, Badge, ButtonLink, Tag } from '@/components/ui/primitives'

function MoreLink({ id, m }: { id: string; m: Member }) {
  return (
    <Link
      href={`/trips/${id}/members/${m.id}`}
      scroll={false}
      aria-label={`${displayName(m)} 더보기`}
      className="flex h-11 w-11 flex-none items-center justify-center text-muted"
    >
      <Icon name="more" />
    </Link>
  )
}

function WideTag({ children }: { children: string }) {
  return (
    <span className="inline-flex h-[26px] items-center rounded-full bg-face px-2.5 text-[12px] text-label">
      {children}
    </span>
  )
}

/** 모바일 참여자 목록 */
export function MemberList({ sp }: { sp: SpaceData }) {
  const id = sp.t.id
  return (
    <div className="px-5">
      <div className="mt-2">
        {sp.members.map((m) => (
          <div key={m.id} className="flex gap-3 border-t border-line py-4">
            <Avatar name={displayName(m)} size={44} />
            <div className="min-w-0 grow">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold">{displayName(m)}</span>
                {m.host && <Badge tone="ink">호스트</Badge>}
              </div>
              <div className="mt-0.5 text-[12px] text-sub">{m.line}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
            <MoreLink id={id} m={m} />
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-[14px] bg-face px-4 py-3.5 text-[12px] leading-[18px] text-muted">
        참여자 프로필은 성사된 테마의 참여자에게만 보여요. 불편한 일이 있으면 프로필의 더보기에서 신고할 수
        있고, 신고 내용은 공개되지 않아요.
      </div>
    </div>
  )
}

/** 데스크톱 참여자 격자(3열) */
export function MemberGrid({ sp }: { sp: SpaceData }) {
  const id = sp.t.id
  return (
    <>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {sp.members.map((m) => (
          <div key={m.id} className="rounded-[20px] p-5 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <div className="flex gap-3.5">
              <Avatar name={displayName(m)} size={52} />
              <div className="min-w-0 grow">
                <div className="flex items-center gap-1.5">
                  <span className="text-[17px] font-bold">{displayName(m)}</span>
                  {m.host && <Badge tone="ink">호스트</Badge>}
                </div>
                <div className="mt-[3px] text-[13px] text-sub">{m.line}</div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {m.tags.map((tag) => (
                    <WideTag key={tag}>{tag}</WideTag>
                  ))}
                </div>
              </div>
              <MoreLink id={id} m={m} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 text-[13px] text-muted">
        참여자 프로필은 성사된 테마의 참여자에게만 보여요. 불편한 일이 있으면 더보기에서 신고할 수 있고, 신고
        내용은 공개되지 않아요.
      </div>
    </>
  )
}

/** 참여자 더보기 내용(프로필 보기 · 신고하기 · 차단하기) */
export function MemberMenu({ m, themeId, hostId }: { m: Member; themeId: string; hostId: string }) {
  const items: [IconName, string, string][] = [
    ['user', '프로필 보기', m.me ? '/my' : m.host ? `/hosts/${hostId}` : `/users/${m.id}`],
    ['flag', '신고하기', `/report?user=${m.id}`],
  ]
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar name={m.name} size={44} />
        <div>
          <div className="text-[16px] font-bold">{m.name}</div>
          <div className="text-[12px] text-sub">{m.sheetLine}</div>
        </div>
      </div>
      <div>
        {items
          .filter(([icon]) => !(m.me && icon !== 'user'))
          .map(([icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className="flex h-14 items-center gap-3.5 border-t border-line text-[16px] text-ink no-underline"
            >
              <Icon name={icon} size={20} weight={1.7} />
              {label}
            </Link>
          ))}
        {!m.me && <BlockButton themeId={themeId} handle={m.id} />}
      </div>
    </>
  )
}

export function CloseButton({ href }: { href: string }) {
  return (
    <div className="grow">
      <ButtonLink href={href} variant="soft" block scroll={false} className="h-[52px]">
        닫기
      </ButtonLink>
    </div>
  )
}
