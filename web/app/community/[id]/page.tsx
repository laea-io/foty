import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnswerForm } from '@/components/community/answer-form'
import { PostActions } from '@/components/community/post-actions'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { Mascot } from '@/components/ui/mascot'
import { Avatar, ButtonLink, DemoNote, Photo } from '@/components/ui/primitives'
import { getViewer } from '@/lib/server/auth'
import { type PostView as Post, post } from '@/lib/server/q/c'
import { type ThemeView, themesByIds } from '@/lib/server/q/themes'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: (await post((await params).id))?.title }
}

function Body({ p, t, loggedIn }: { p: Post; t?: ThemeView; loggedIn: boolean }) {
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
      <p className="mt-4 mb-0 whitespace-pre-line text-[16px] leading-[26px] text-[#2a2d34]">{p.body}</p>
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
            <span className="text-[12px] text-sub">다음 날짜</span>
          </div>
          <div className="-mt-2">
            <ThemeRow t={t} />
          </div>
        </>
      )}
      {(p.kind === '질문' || p.answers.length > 0) && (
        <section id="answer" className="mt-7">
          <h2 className="mb-1 text-[18px] font-extrabold tracking-[-0.04em]">답변 {p.answers.length}</h2>
          {p.answers.map((a, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 답변 순서가 곧 의미
            <div key={i} className="border-t border-line py-3.5 first:border-t-0">
              <div className="text-[13px] font-semibold">
                {a.author} <span className="font-normal text-muted">· {a.when}</span>
              </div>
              <div className="mt-1 whitespace-pre-line text-[15px] leading-6">{a.body}</div>
            </div>
          ))}
          {loggedIn ? (
            <AnswerForm postId={p.id} />
          ) : (
            <ButtonLink href={`/login?next=/community/${p.id}`} variant="outline" block className="mt-3">
              로그인하고 답변하기
            </ButtonLink>
          )}
        </section>
      )}
    </>
  )
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await post((await params).id)
  if (!p) notFound()
  const [t] = p.themeId ? await themesByIds([p.themeId]) : []
  const viewer = await getViewer()
  return (
    <>
      <MobileFrame bottom={p.kind !== '질문'}>
        <BackBar title="커뮤니티" back="/community" />
        <div className="px-5">
          <Body p={p} t={t} loggedIn={!!viewer} />
          <DemoNote />
        </div>
        {p.kind !== '질문' && (
          <BottomBar>
            <div className="grow">
              <PostActions p={p} size="wide" />
            </div>
          </BottomBar>
        )}
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[680px]">
          <div className="mb-2 text-[14px] text-sub">커뮤니티</div>
          <Body p={p} t={t} loggedIn={!!viewer} />
          {p.kind !== '질문' && <PostActions p={p} size="wide" />}
        </div>
      </DesktopFrame>
    </>
  )
}
