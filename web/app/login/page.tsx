import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { demoLoginAction, loginAction } from '@/app/actions/auth'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Field } from '@/components/a/form'
import { DemoLogin, KakaoButton, OrLine } from '@/components/a/login-buttons'
import { LegalLinks } from '@/components/legal/doc'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Mascot } from '@/components/ui/mascot'
import { Button, Photo } from '@/components/ui/primitives'
import { img } from '@/lib/demo/themes'
import { env } from '@/lib/env'
import { getViewer, safeNext } from '@/lib/server/auth'

export const metadata: Metadata = { title: '로그인' }

function Brand({ lg }: { lg?: boolean }) {
  return (
    <>
      <Mascot size={72} />
      <div className="mt-3.5 text-[40px] leading-none font-black italic tracking-[-0.07em]">foty</div>
      <div className="mt-[18px] text-sub" style={{ fontSize: lg ? 16 : 15 }}>
        남양주가 여는 당일 테마 여행
      </div>
    </>
  )
}

type SP = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** 이메일 로그인 — foty는 로그인한 뒤에 쓸 수 있어서 첫 화면에 바로 둔다 */
function EmailLogin({
  next,
  signup,
  notice,
  kakao,
}: {
  next: string
  signup: string
  notice?: string
  /** 카카오 REST 키가 있을 때만 카카오 버튼 + 구분선 */
  kakao: boolean
}) {
  return (
    <ActionForm action={loginAction} className="w-full text-left">
      {kakao && <KakaoButton next={next} />}
      {notice && (
        <p role="status" className="m-0 mt-3 text-center text-[13px] text-warn">
          {notice}
        </p>
      )}
      {kakao ? <OrLine /> : <div className="h-2" />}
      {next !== '/' && <input type="hidden" name="next" value={next} />}
      <div className="flex flex-col gap-4">
        <Field label="이메일" name="email" type="email" placeholder="example@foty.kr" autoComplete="email" />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          placeholder="8자 이상"
          autoComplete="current-password"
        />
      </div>
      <FormError className="mt-3.5" />
      <Button type="submit" size="lg" block className="mt-6">
        로그인
      </Button>
      <div className="mt-5 text-center text-[14px] text-sub">
        <Link href="/login/forgot" className="text-sub">
          비밀번호를 잊었어요
        </Link>
        <span className="mx-2 text-line">|</span>
        처음이세요?{' '}
        <Link href={signup} className="font-semibold text-ink">
          이메일로 가입하기
        </Link>
      </div>
    </ActionForm>
  )
}

function noticeFor(sp: Awaited<SP>) {
  if (one(sp.kakao) === 'suspended') return '이용이 정지된 계정이에요. 고객센터로 문의해 주세요.'
  if (one(sp.reset) === '1') return '비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.'
  if (one(sp.deleted) === '1') return '탈퇴가 끝났어요. 그동안 함께해 주셔서 고마워요.'
  if (one(sp.kakao) === 'off') return '카카오 로그인을 준비하고 있어요. 이메일로 계속해 주세요.'
  if (one(sp.kakao) === 'fail')
    return '카카오 로그인이 끝나지 않았어요. 다시 시도하거나 이메일로 계속해 주세요.'
  return undefined
}

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const next = safeNext(one(sp.next))
  if (await getViewer()) redirect(next)
  const demo = env.DEMO_MODE === '1'
  const kakao = !!env.KAKAO_REST_KEY
  const notice = noticeFor(sp)
  const signup = `/signup/email${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`
  return (
    <>
      {/* ── 모바일 ── */}
      <MobileFrame className="flex min-h-dvh flex-col">
        <div className="flex flex-col items-center px-6 pt-[72px] text-center">
          <Brand />
        </div>
        <div className="px-6 pt-11">
          <EmailLogin next={next} signup={signup} notice={notice} kakao={kakao} />
          {demo && <DemoLogin action={demoLoginAction} next={next} />}
        </div>
        <div className="grow" />
        <LegalLinks className="pt-10 pb-9" />
      </MobileFrame>

      {/* ── 데스크톱: 머리·바닥 없이 사진 반 + 로그인 반 ── */}
      <DesktopFrame className="max-w-none! p-0!">
        <div className="flex min-h-[900px]">
          <div className="relative flex-1 overflow-hidden">
            <Photo
              src={img.sujongsa.src}
              alt={img.sujongsa.alt}
              bg={img.sujongsa.bg}
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,18,0.1)_40%,rgba(11,13,18,0.75)_100%)]" />
            <div className="absolute bottom-14 left-14 text-white">
              <div className="text-[34px] leading-[42px] font-extrabold tracking-[-0.05em]">
                이번 주말,
                <br />
                남양주가 초대해요
              </div>
              <div className="mt-2.5 text-[14px] text-white/80">수종사 · 남양주 조안면</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mx-auto flex w-[400px] flex-col items-center pt-[120px] pb-20 text-center">
              <Brand lg />
              <div className="mt-11 w-full">
                <EmailLogin next={next} signup={signup} notice={notice} kakao={kakao} />
              </div>
              {demo && <DemoLogin action={demoLoginAction} next={next} />}
              <LegalLinks className="mt-[72px]" />
            </div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
