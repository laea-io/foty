import type { ReactNode } from 'react'
import { BottomBar } from '@/components/shell/mobile'
import { ButtonLink } from '@/components/ui/primitives'

/** [나중에 설정 | 다음] 버튼 줄. 모바일은 하단 고정, 데스크톱은 본문 아래(margin-top 32). */
export function LaterNext({
  laterHref = '/',
  laterLabel = '나중에 설정',
  nextHref,
  nextLabel,
  desktop,
}: {
  laterHref?: string
  laterLabel?: string
  nextHref: string
  nextLabel: ReactNode
  desktop?: boolean
}) {
  const inner = (
    <>
      <ButtonLink href={laterHref} variant="outline" size="lg">
        {laterLabel}
      </ButtonLink>
      <div className="grow">
        <ButtonLink href={nextHref} size="lg" block>
          {nextLabel}
        </ButtonLink>
      </div>
    </>
  )
  return desktop ? <div className="mt-8 flex gap-2.5">{inner}</div> : <BottomBar>{inner}</BottomBar>
}
