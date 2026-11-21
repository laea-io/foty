import type { Metadata } from 'next'
import { AiInput, AiThread } from '@/components/b/trips/ai'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import { CloseLink, MobileSheet } from '@/components/b/trips/sheet'
import {
  SpaceDesktopHead,
  SpaceMobileHead,
  SpacePlanDesktop,
  SpacePlanMobile,
} from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams
export const metadata: Metadata = { title: 'AI 도우미' }

/** AI 도우미 — 모바일은 공간 위 바텀시트, 데스크톱은 약도 자리에 패널 */
export default async function AiPage({ params }: Props) {
  const { s, t, change } = loadSpace((await params).id)
  const back = `/trips/${t.id}`
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead s={s} t={t} tab="plan" />
        <SpacePlanMobile t={t} change={change} />
        <DemoNote />
        <div className="h-8" />
        <MobileSheet title="AI 도우미" closeHref={back} footer={<AiInput id={t.id} />}>
          <AiThread id={t.id} />
        </MobileSheet>
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead s={s} t={t} tab="plan" />
        <SpacePlanDesktop
          t={t}
          change={change}
          right={
            <section
              aria-label="AI 도우미"
              className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.03em]">AI 도우미</h2>
                <span className="-mr-3">
                  <CloseLink href={back} />
                </span>
              </div>
              <AiThread id={t.id} wide />
              <div className="mt-[22px]">
                <AiInput id={t.id} wide />
              </div>
            </section>
          }
        />
      </DesktopFrame>
    </>
  )
}
