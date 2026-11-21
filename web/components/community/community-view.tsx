import Link from 'next/link'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { Icon } from '@/components/ui/icon'
import { Avatar, ButtonLink, DemoNote, Photo } from '@/components/ui/primitives'
import type { PostView as Post } from '@/lib/server/q/c'
import type { ThemeView } from '@/lib/server/q/themes'

type PostKind = Post['kind']

import { PostActions } from './post-actions'

const kinds: ('전체' | PostKind)[] = ['전체', '여행 후기', '코스 공유', '질문']

function KindChips({ current }: { current: string }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {kinds.map((k) => {
        const on = current === k
        return (
          <Link
            key={k}
            href={k === '전체' ? '/community' : `/community?kind=${encodeURIComponent(k)}`}
            aria-current={on ? 'page' : undefined}
            className={`inline-flex h-11 flex-none items-center whitespace-nowrap rounded-full px-4 text-[15px] no-underline ${
              on ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'
            }`}
          >
            {k}
          </Link>
        )
      })}
    </div>
  )
}

export function CommunityView({ list, kind, open }: { list: Post[]; kind: string; open: ThemeView[] }) {
  return (
    <>
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          <KindChips current={kind} />
          <div className="h-2" />
          {list.map((p) => (
            <article key={p.id} className="mt-2 rounded-[20px] bg-face p-4">
              <Link href={`/community/${p.id}`} className="block text-ink no-underline">
                <div className="flex items-center gap-2">
                  <Avatar name={p.author} size={32} />
                  <div>
                    <div className="text-[13px] font-semibold">{p.author}</div>
                    <div className="text-[11px] text-muted">
                      {p.kind} · {p.when}
                    </div>
                  </div>
                </div>
                <h3 className="mt-2.5 mb-0 text-[15px] font-semibold tracking-[-0.02em]">{p.title}</h3>
                <p className="mt-1 mb-0 text-[13px] leading-[1.65] text-sub">{p.summary}</p>
                {p.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {p.photos.map((ph) => (
                      <Photo
                        key={ph.src}
                        src={ph.src}
                        alt={ph.alt}
                        bg={ph.bg}
                        className="h-[100px] w-full rounded-[12px]"
                      />
                    ))}
                  </div>
                )}
              </Link>
              <PostActions p={p} size="card" />
            </article>
          ))}
          <DemoNote />
        </div>
        <Link
          href="/community/write"
          aria-label="글쓰기"
          className="fixed right-5 bottom-[92px] z-30 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-ink text-white shadow-[0_8px_20px_rgba(27,29,36,0.25)] lg:hidden"
        >
          <Icon name="edit" />
        </Link>
      </MobileFrame>

      <DesktopFrame>
        <div className="flex items-center gap-4">
          <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">커뮤니티</h1>
          <span className="grow" />
          <ButtonLink href="/community/write" size="sm" icon="edit">
            글쓰기
          </ButtonLink>
        </div>
        <div className="mt-5">
          <KindChips current={kind} />
        </div>
        <div className="mt-5 flex items-start gap-14">
          <div className="min-w-0 flex-1">
            {list.map((p) => (
              <article key={p.id} className="border-t border-line py-6">
                <Link href={`/community/${p.id}`} className="block text-ink no-underline">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.author} size={36} />
                    <div>
                      <div className="text-[14px] font-semibold">{p.author}</div>
                      <div className="text-[12px] text-muted">
                        {p.kind} · {p.when}
                        {p.kind !== '질문' && ' · 시연용 예시'}
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-3 mb-0 text-[18px] font-bold tracking-[-0.03em]">{p.title}</h3>
                  <p className="mt-1.5 mb-0 text-[15px] leading-6 text-sub">{p.summary}</p>
                  {p.photos.length > 0 && (
                    <div className="mt-3.5 grid grid-cols-3 gap-2">
                      {p.photos.map((ph) => (
                        <Photo
                          key={ph.src}
                          src={ph.src}
                          alt={ph.alt}
                          bg={ph.bg}
                          className="h-[150px] w-full rounded-[14px]"
                        />
                      ))}
                    </div>
                  )}
                </Link>
                <PostActions p={p} size="wide" />
              </article>
            ))}
          </div>
          <div className="sticky top-6 w-[380px] flex-none">
            <div className="mb-1 text-[16px] font-extrabold tracking-[-0.03em]">이번 주말 열린 테마</div>
            {open.map((t) => (
              <ThemeRow key={t.id} t={t} />
            ))}
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
