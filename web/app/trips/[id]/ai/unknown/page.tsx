import type { Metadata } from 'next'
import Link from 'next/link'
import { AiInput } from '@/components/b/trips/ai'
import { loadSpace } from '@/components/b/trips/load'
import { PageTitle, SimpleScreen } from '@/components/b/trips/simple'
import { Mascot } from '@/components/ui/mascot'
import { Badge } from '@/components/ui/primitives'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = { title: 'AI 도우미' }

/** AI 도우미 — 확인된 곳을 찾지 못했을 때. 추측한 값은 넣지 않는다. */
export default async function AiUnknownPage({ params, searchParams }: Props) {
  const { t } = loadSpace((await params).id)
  const raw = (await searchParams).q
  const q = (Array.isArray(raw) ? raw[0] : raw) || '일요일에 여는 카페 찾아줘'
  return (
    <SimpleScreen
      title="AI 도우미"
      back={`/trips/${t.id}`}
      bottom={
        <div className="grow">
          <AiInput id={t.id} />
        </div>
      }
      desktopBottom={
        <div className="grow">
          <AiInput id={t.id} wide />
        </div>
      }
    >
      <PageTitle>AI 도우미</PageTitle>
      <div className="mt-5 flex justify-end">
        <div className="rounded-[16px_16px_4px_16px] bg-ink px-3.5 py-2.5 text-[15px] text-white">{q}</div>
      </div>
      <div className="mt-[22px] mb-3 flex items-center gap-2 text-[15px] font-semibold">
        <Mascot size={28} tone="ink" />
        확인된 곳을 찾지 못했어요
      </div>
      <div className="rounded-[16px] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold">강변 카페</span>
          <Badge tone="warn">재확인 필요</Badge>
        </div>
        <div className="mt-1.5 text-[13px] leading-5 text-sub">
          운영시간과 가격을 확인하지 못했어요. 추측한 값은 넣지 않았어요.
        </div>
        <div className="mt-2.5 flex gap-4 text-[13px]">
          <a href="#source" className="font-semibold text-ink">
            출처 열기
          </a>
          <Link href={`/trips/${t.id}/chat`} className="font-semibold text-ink">
            호스트에게 물어보기
          </Link>
        </div>
      </div>
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        검토된 장소 목록에서만 찾아요. 실시간 검색 결과가 아니에요.
      </div>
    </SimpleScreen>
  )
}
