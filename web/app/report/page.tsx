import type { Metadata } from 'next'
import { Narrow, PageTitle } from '@/components/a/form'
import { PickGroup } from '@/components/a/onboarding'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, ButtonLink, DemoNote } from '@/components/ui/primitives'
import { hostById, personById } from '@/lib/demo/people'
import { themeById } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '신고' }

type Target = { name: string; line: string; person: boolean; back: string }

/** ?user=people id · ?theme=테마 id. 없으면 시연 기본(민재) */
function targetFrom(sp: Record<string, string | string[] | undefined>): Target {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined
  const t = themeById(one('theme') ?? '')
  if (t) {
    const h = hostById(t.hostId)
    return { name: t.title, line: `${h?.name ?? ''} 호스트의 테마`, person: false, back: `/themes/${t.id}` }
  }
  const p = personById(one('user') ?? '')
  if (p)
    return { name: p.name, line: '로스터리에서 배우는 핸드드립 참여자', person: true, back: `/users/${p.id}` }
  return {
    name: '민재',
    line: '로스터리에서 배우는 핸드드립 참여자',
    person: true,
    back: '/trips/gwangneung-morning/members',
  }
}

function Body({ t }: { t: Target }) {
  return (
    <>
      <PageTitle sub="신고 내용은 상대에게 공개되지 않고, 공개 후기와 따로 처리돼요.">
        무슨 일이 있었나요?
      </PageTitle>
      <div className="mt-[18px]">
        <div className="flex gap-3 border-t border-line py-4">
          <Avatar name={t.name} size={44} />
          <div className="min-w-0 grow">
            <div className="text-[15px] font-bold">{t.name}</div>
            <div className="mt-0.5 text-[12px] text-sub">{t.line}</div>
          </div>
        </div>
      </div>
      <PickGroup
        title="신고 사유"
        options={[
          '약속에 나오지 않았어요',
          '불쾌한 말이나 행동',
          '개인 연락을 계속 요구해요',
          '허위 정보',
          '기타',
        ]}
        initial={[t.person ? '약속에 나오지 않았어요' : '허위 정보']}
      />
      <label className="block">
        <span className="mt-[26px] mb-2.5 block text-[14px] font-semibold">
          자세한 내용 <span className="font-normal text-muted">선택</span>
        </span>
        <textarea
          name="detail"
          defaultValue={t.person ? '집결 시간에 나오지 않았고 연락도 닿지 않았어요.' : ''}
          className="block min-h-[110px] w-full resize-y rounded-[14px] border-0 bg-face px-4 py-3.5 text-[15px] leading-[23px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-ink"
        />
      </label>
      {t.person && (
        <div className="mt-[18px]">
          <ToggleRow title="이 사람 차단하기" sub="서로의 프로필과 신청이 보이지 않아요" defaultOn />
        </div>
      )}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        운영팀이 확인한 뒤 처리 상태를 알려드려요. 급한 위험이 있으면 112에 먼저 연락해 주세요.
      </div>
    </>
  )
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const t = targetFrom(await searchParams)
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="신고" back={t.back} />
        <div className="px-5">
          <Body t={t} />
        </div>
        <DemoNote />
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/my/blocks" size="lg" block>
              신고 보내기
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="신고">
          <Body t={t} />
          <div className="mt-8 flex gap-2.5">
            <div className="grow">
              <ButtonLink href="/my/blocks" size="lg" block>
                신고 보내기
              </ButtonLink>
            </div>
          </div>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
