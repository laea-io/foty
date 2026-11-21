import type { ReactNode } from 'react'
import { BottomBar } from '@/components/shell/mobile'
import { Button, ButtonLink } from '@/components/ui/primitives'

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

/** 폼 안의 [나중에 설정 | 다음] — 둘 다 보내기 버튼(나중에 설정 = skip). laterHref가 있으면 그쪽은 링크 */
export function LaterNextSubmit({
  laterLabel = '나중에 설정',
  laterHref,
  nextLabel,
  desktop,
}: {
  laterLabel?: string
  laterHref?: string
  nextLabel: ReactNode
  desktop?: boolean
}) {
  const inner = (
    <>
      {laterHref ? (
        <ButtonLink href={laterHref} variant="outline" size="lg">
          {laterLabel}
        </ButtonLink>
      ) : (
        <Button type="submit" name="skip" value="1" variant="outline" size="lg" formNoValidate>
          {laterLabel}
        </Button>
      )}
      <div className="grow">
        <Button type="submit" size="lg" block>
          {nextLabel}
        </Button>
      </div>
    </>
  )
  return desktop ? <div className="mt-8 flex gap-2.5">{inner}</div> : <BottomBar>{inner}</BottomBar>
}
