import type { Metadata } from 'next'
import Link from 'next/link'
import { H2, Narrow } from '@/components/a/form'
import { StateButton } from '@/components/a/state-button'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, Badge, DemoNote, Segmented } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '신고·차단 내역' }

function Body() {
  return (
    <>
      <Segmented
        current="#blocks"
        items={[
          { href: '#blocks', label: '차단 1' },
          { href: '#reports', label: '신고 내역 1' },
        ]}
      />
      <div id="blocks" className="mt-2">
        <div className="flex gap-3 border-t border-line py-4">
          <Avatar name="민재" size={44} />
          <div className="min-w-0 grow">
            <div className="text-[15px] font-bold">민재</div>
            <div className="mt-0.5 text-[12px] text-sub">11월 9일 차단</div>
          </div>
          <StateButton off="해제" on="다시 차단" />
        </div>
      </div>
      <div id="reports">
        <H2>신고 내역</H2>
      </div>
      <div className="border-t border-line py-4">
        <div className="flex justify-between">
          <span className="text-[15px] font-semibold">약속 시간 불참</span>
          <Badge tone="soft">관리자 확인 중</Badge>
        </div>
        <div className="mt-1 text-[12px] text-sub">11월 9일 접수 · 신고 내용은 상대에게 공개되지 않아요</div>
        <Link href="/report?appeal=1" className="mt-2.5 inline-block text-[13px] text-sub">
          이의제기 · 추가 내용 보내기
        </Link>
      </div>
    </>
  )
}

export default function BlocksPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="신고·차단 내역" back="/my" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="신고·차단 내역">
          <Body />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
