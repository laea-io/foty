import { NotifyButton } from '@/components/theme/notify-button'
import { Mascot } from '@/components/ui/mascot'
import { ButtonLink } from '@/components/ui/primitives'

/** 조건에 맞는 테마가 없을 때. 성사를 보장하는 표현은 쓰지 않는다. */
export function NoThemes({
  conditions,
  filterHref = '/filter',
}: {
  conditions: string
  filterHref?: string
}) {
  return (
    <div className="pt-12 pb-6">
      <div className="flex flex-col items-center text-center">
        <Mascot size={64} tone="gray" />
        <div className="mt-5 text-[18px] font-bold tracking-[-0.03em]">조건에 맞는 테마가 없어요</div>
        <div className="mt-1.5 text-[13px] leading-5 text-sub">
          {conditions}
          <br />
          조건을 조금 바꾸면 테마를 찾을 수 있어요
        </div>
      </div>
      <div className="mx-auto mt-7 flex max-w-[400px] flex-col gap-2">
        <ButtonLink href={filterHref} className="h-[52px]">
          조건 바꾸기
        </ButtonLink>
        <ButtonLink href="/request" variant="outline" className="h-[52px]">
          이런 테마 요청하기
        </ButtonLink>
        <NotifyButton />
      </div>
    </div>
  )
}
