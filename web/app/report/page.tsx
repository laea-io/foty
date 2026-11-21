import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { reportAction } from '@/app/actions/a'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Narrow, PageTitle } from '@/components/a/form'
import { PickGroup } from '@/components/a/onboarding'
import { ErrorBody } from '@/components/a/states'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, Button, ButtonLink, DemoNote } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth'
import { type ReportTarget, reportTarget } from '@/lib/server/q/a'
import { rules } from '@/lib/server/rules'

export const metadata: Metadata = { title: '신고' }

type SP = Record<string, string | string[] | undefined>
const one = (sp: SP, k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined

function Body({ t }: { t: ReportTarget }) {
  return (
    <>
      {t.handle && <input type="hidden" name="user" value={t.handle} />}
      {t.themeId && <input type="hidden" name="theme" value={t.themeId} />}
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
        name="reason"
        title="신고 사유"
        options={rules.reportReasons}
        initial={[t.person ? rules.reportReasons[0] : rules.reportReasons[rules.reportReasons.length - 1]]}
      />
      <label className="block">
        <span className="mt-[26px] mb-2.5 block text-[14px] font-semibold">
          자세한 내용 <span className="font-normal text-muted">선택</span>
        </span>
        <textarea
          name="detail"
          maxLength={1000}
          placeholder={
            t.person ? '집결 시간에 나오지 않았고 연락도 닿지 않았어요.' : '무슨 일이 있었는지 적어 주세요.'
          }
          className="block min-h-[110px] w-full resize-y rounded-[14px] border-0 bg-face px-4 py-3.5 text-[15px] leading-[23px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink"
        />
      </label>
      {t.person && (
        <div className="mt-[18px]">
          <ToggleRow
            name="block"
            title="이 사람 차단하기"
            sub="서로의 프로필과 신청이 보이지 않아요"
            defaultOn
          />
        </div>
      )}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        운영팀이 확인한 뒤 처리 상태를 알려드려요. 급한 위험이 있으면 112에 먼저 연락해 주세요.
      </div>
      <FormError className="mt-4" />
    </>
  )
}

function Done() {
  return (
    <ErrorBody
      mascot
      title="신고를 보냈어요"
      body={
        <>
          운영팀이 확인한 뒤 처리 상태를 알림으로 알려드려요.
          <br />
          신고 내용은 상대에게 공개되지 않아요.
        </>
      }
      actions={
        <>
          <ButtonLink href="/my/blocks" size="lg" block>
            신고·차단 내역 보기
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg" block>
            홈으로
          </ButtonLink>
        </>
      }
    />
  )
}

export default async function ReportPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const user = one(sp, 'user')
  const theme = one(sp, 'theme')
  const qs = new URLSearchParams()
  if (user) qs.set('user', user)
  if (theme) qs.set('theme', theme)
  await requireViewer(`/report${qs.size ? `?${qs}` : ''}`)
  if (one(sp, 'done')) {
    return (
      <>
        <MobileFrame>
          <BackBar title="신고" back="/my/blocks" />
          <div className="px-5">
            <Done />
          </div>
          <DemoNote className="pb-10" />
        </MobileFrame>
        <DesktopFrame>
          <Narrow eyebrow="신고">
            <Done />
          </Narrow>
        </DesktopFrame>
      </>
    )
  }
  const t = await reportTarget(db, { user, theme })
  if (!t) notFound()
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="신고" back={t.back} />
        <ActionForm action={reportAction}>
          <div className="px-5">
            <Body t={t} />
          </div>
          <DemoNote />
          <BottomBar>
            <div className="grow">
              <Button type="submit" size="lg" block>
                신고 보내기
              </Button>
            </div>
          </BottomBar>
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="신고">
          <ActionForm action={reportAction}>
            <Body t={t} />
            <div className="mt-8 flex gap-2.5">
              <div className="grow">
                <Button type="submit" size="lg" block>
                  신고 보내기
                </Button>
              </div>
            </div>
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
