import type { Metadata } from 'next'
import { Narrow, PageTitle } from '@/components/a/form'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '공개 범위' }

const rows: [string, string, boolean][] = [
  ['프로필 사진', '끄면 기본 아바타로 보여요', false],
  ['MBTI', '자기소개에만 보여요', false],
  ['출발 권역', '성사된 테마의 참여자에게 보여요', true],
  ['동행 기록', '참여 횟수와 행동 태그', true],
  ['내가 쓴 후기', '커뮤니티에 닉네임으로 공개돼요', true],
]

function Body() {
  return (
    <>
      <PageTitle sub="다른 참여자 프로필과 집결 정보는 성사된 테마의 참여자에게만 보여요.">
        무엇을 보여줄까요?
      </PageTitle>
      <div className="mt-[18px]">
        {rows.map(([t, s, on]) => (
          <ToggleRow key={t} title={t} sub={s} defaultOn={on} />
        ))}
      </div>
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        정확한 집 주소는 수집하지 않아요. 개인 연락처는 서비스가 요구하지 않아요.
      </div>
    </>
  )
}

export default function PrivacyPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="공개 범위" back="/my" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="공개 범위">
          <Body />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
