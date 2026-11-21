import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { H2, Narrow } from '@/components/a/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { ButtonLink, DemoNote, Photo } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth'
import { stampPlace } from '@/lib/server/q/a'

export const metadata: Metadata = { title: '스탬프' }

type StampPlace = NonNullable<Awaited<ReturnType<typeof stampPlace>>>

function Body({ p }: { p: StampPlace }) {
  return (
    <>
      <div className="flex flex-col items-center pt-7 text-center">
        <Mascot size={112} label={`${p.name} 스탬프`} />
        <div className="mt-[18px] text-[24px] font-extrabold tracking-[-0.04em]">{p.name}</div>
        <div className="mt-1 text-[13px] text-sub">
          {p.regionName} · 방문 {p.visits}회
        </div>
      </div>
      {p.image && (
        <div className="mt-5">
          <Photo
            src={p.image.src}
            alt={p.image.alt}
            bg={p.image.bg}
            className="h-[170px] w-full rounded-[16px]"
          />
        </div>
      )}
      <H2>방문 기록</H2>
      {p.records.map((r, i) => (
        <Link
          key={r.themeId}
          href={`/themes/${r.themeId}?view=done`}
          className={`flex items-center gap-3 py-[15px] text-ink no-underline ${i ? 'border-t border-line' : ''}`}
        >
          <span className="grow">
            <span className="block text-[15px] font-semibold">{r.title}</span>
            <span className="mt-0.5 block text-[12px] text-sub">{r.date} · 체크인 확인</span>
          </span>
          <Icon name="chevron" size={14} weight={1.8} className="text-muted" />
        </Link>
      ))}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        스탬프는 장소마다 하나이고 방문 횟수를 함께 적어요. 같은 날 같은 장소는 한 번으로 세요.
      </div>
    </>
  )
}

function Buttons({ p }: { p: StampPlace }) {
  return (
    <>
      <ButtonLink href="/community" variant="outline" size="lg">
        후기 보기
      </ButtonLink>
      <div className="grow">
        <ButtonLink href={`/my/stamps/region/${p.region}`} size="lg" block>
          이 권역의 다른 테마 보기
        </ButtonLink>
      </div>
    </>
  )
}

export default async function StampDetailPage({ params }: { params: Promise<{ place: string }> }) {
  const id = (await params).place
  const v = await requireViewer(`/my/stamps/${id}`)
  const p = await stampPlace(db, v.id, id)
  if (!p) notFound()
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="스탬프" back="/my/stamps" />
        <div className="px-5">
          <Body p={p} />
        </div>
        <DemoNote />
        <BottomBar>
          <Buttons p={p} />
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="스탬프">
          <Body p={p} />
          <div className="mt-8 flex gap-2.5">
            <Buttons p={p} />
          </div>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
