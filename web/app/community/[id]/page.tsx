import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostActions } from '@/components/community/post-actions'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { Mascot } from '@/components/ui/mascot'
import { Avatar, ButtonLink, DemoNote, Photo } from '@/components/ui/primitives'
import { type Post, postById, posts } from '@/lib/demo/community'
import { themeById } from '@/lib/demo/themes'

export function generateStaticParams() {
  return posts.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: postById((await params).id)?.title }
}

function Body({ p }: { p: Post }) {
  const t = p.themeId ? themeById(p.themeId) : undefined
  const [hero, ...rest] = p.photos
  return (
    <>
      <div className="flex items-center gap-2.5 pt-3">
        <Avatar name={p.author} size={36} />
        <div>
          <div className="text-[14px] font-semibold">
            {p.author}
            {p.trips > 0 ? ` · 동행 ${p.trips}회` : ' · 첫 동행이에요'}
          </div>
          <div className="text-[12px] text-muted">
            {p.kind} · {p.when} · 시연용 예시
          </div>
        </div>
      </div>
      {p.stamp && (
        <div className="mt-3 inline-flex h-[30px] items-center gap-1.5 rounded-full bg-face pr-3 pl-1.5 text-[12px] font-semibold">
          <Mascot size={20} />
          {p.stamp} 스탬프 · 체크인으로 확인된 방문
        </div>
      )}
      <h1 className="mt-3.5 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">{p.title}</h1>
      {hero && (
        <div className="mt-3.5">
          <Photo src={hero.src} alt={hero.alt} bg={hero.bg} className="h-[220px] w-full rounded-[16px]" />
        </div>
      )}
      <p className="mt-4 mb-0 text-[16px] leading-[26px] text-[#2a2d34]">{p.body ?? p.summary}</p>
      {rest.length > 0 && (
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {rest.map((ph) => (
            <Photo
              key={ph.src}
              src={ph.src}
              alt={ph.alt}
              bg={ph.bg}
              className="h-[130px] w-full rounded-[14px]"
            />
          ))}
        </div>
      )}
      {p.facts && (
        <div className="mt-5 flex border-y border-line py-3.5 text-[13px] text-sub">
          {p.facts.map((f) => (
            <span key={f} className="flex-1">
              {f}
            </span>
          ))}
        </div>
      )}
      {t && (
        <>
          <div className="mt-7 mb-3 flex items-baseline justify-between">
            <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">다녀온 테마</h2>
          </div>
          <div className="-mt-2">
            <ThemeRow t={t} />
          </div>
        </>
      )}
    </>
  )
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const p = postById((await params).id)
  if (!p) notFound()
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="커뮤니티" back="/community" />
        <div className="px-5">
          <Body p={p} />
          <DemoNote />
        </div>
        <BottomBar>
          {p.kind === '질문' ? (
            <div className="grow">
              <ButtonLink href="/community/ask" size="lg" block>
                답변하기
              </ButtonLink>
            </div>
          ) : (
            <>
              <ButtonLink href={`/course?place=${p.coursePlace ?? ''}`} variant="outline" size="lg">
                코스 가져오기
              </ButtonLink>
              <div className="grow">
                <ButtonLink href={p.themeId ? `/themes/${p.themeId}` : '/'} size="lg" block>
                  이 테마의 다음 날짜 보기
                </ButtonLink>
              </div>
            </>
          )}
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[680px]">
          <div className="mb-2 text-[14px] text-sub">커뮤니티</div>
          <Body p={p} />
          <PostActions p={p} size="wide" />
        </div>
      </DesktopFrame>
    </>
  )
}
