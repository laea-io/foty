import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReviewForm } from '@/components/community/review-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, ButtonLink, DemoNote } from '@/components/ui/primitives'
import { getViewer } from '@/lib/server/auth'
import { reviewableTheme } from '@/lib/server/q/c'

export const metadata: Metadata = { title: '후기 남기기' }

export default async function WriteReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const sp = await searchParams
  const viewer = await getViewer()
  if (!viewer)
    redirect(`/login?next=${encodeURIComponent(`/community/write${sp.theme ? `?theme=${sp.theme}` : ''}`)}`)
  const t = await reviewableTheme(viewer.id, sp.theme)
  if (!t) {
    const none = (
      <div className="py-16 text-center">
        <div className="text-[18px] font-bold">아직 후기를 남길 여행이 없어요</div>
        <div className="mt-1.5 text-[13px] text-sub">현장에서 체크인한 테마에만 후기를 남길 수 있어요.</div>
        <ButtonLink href="/community/ask" variant="outline" className="mt-6">
          질문 남기기
        </ButtonLink>
      </div>
    )
    return (
      <>
        <MobileFrame>
          <BackBar title="후기" back="/community" />
          <div className="px-5">{none}</div>
        </MobileFrame>
        <DesktopFrame>{none}</DesktopFrame>
      </>
    )
  }
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="후기" back="/trips/past" />
        <div className="px-5">
          <ReviewForm t={t} id="review-m" />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="review-m" size="lg" block>
              후기 올리기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">후기</div>
          <ReviewForm t={t} id="review-d" inline />
        </div>
      </DesktopFrame>
    </>
  )
}
