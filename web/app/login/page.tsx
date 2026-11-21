import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginButtons } from '@/components/a/login-buttons'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Mascot } from '@/components/ui/mascot'
import { IconButton, Photo } from '@/components/ui/primitives'
import { img } from '@/lib/demo/themes'

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

export default function LoginPage() {
  return (
    <>
      {/* ── 모바일 ── */}
      <MobileFrame className="flex min-h-dvh flex-col">
        <header className="flex h-14 items-center px-2">
          <IconButton icon="close" label="닫기" href="/" />
        </header>
        <div className="flex flex-col items-center px-6 pt-[72px] text-center">
          <Brand />
        </div>
        <div className="px-6 pt-14">
          <LoginButtons recent emailHref="/login/email" />
        </div>
        <div className="mt-6 flex justify-center gap-7 text-[13px] text-sub">
          <a href="#find-id" className="no-underline">
            아이디 찾기
          </a>
          <Link href="/signup/email" className="no-underline">
            이메일 가입
          </Link>
        </div>
        <div className="grow" />
        <div className="flex justify-center gap-3.5 pt-10 pb-9 text-[12px] text-muted">
          <span>이용약관</span>
          <span className="text-line">|</span>
          <span>개인정보 처리 방침</span>
          <span className="text-line">|</span>
          <span>고객센터</span>
        </div>
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
              <div className="mt-2.5 text-[14px] text-white/80">수종사 · 11.21 (토) 테마의 핵심 장소</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mx-auto flex w-[400px] flex-col items-center pt-[120px] pb-20 text-center">
              <Brand lg />
              <div className="mt-12 w-full">
                <LoginButtons emailHref="/login/email" />
              </div>
              <div className="mt-6 flex gap-7 text-[13px] text-sub">
                <a href="#find-id" className="no-underline">
                  아이디 찾기
                </a>
                <Link href="/signup/email" className="no-underline">
                  이메일 가입
                </Link>
                <Link href="/">둘러보기</Link>
              </div>
              <div className="mt-[72px] text-[12px] text-muted">이용약관 | 개인정보 처리 방침 | 고객센터</div>
            </div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
