import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

const pill =
  'relative flex h-[54px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold no-underline'

function KakaoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      width={18}
      height={18}
      fill="#191600"
      stroke="#191600"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
    >
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z" />
      <path stroke="#ffffff" d="M8.5 9h7M8.5 12h4.5" />
    </svg>
  )
}

/** 로그인 버튼 세 개(카카오 · Apple · 이메일) */
export function LoginButtons({ recent, emailHref }: { recent?: boolean; emailHref: string }) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <Link href="/onboarding" className={`${pill} bg-kakao text-[#191600]`}>
        <KakaoIcon />
        카카오로 3초만에 시작하기
        {recent && (
          <span className="absolute -top-[9px] right-3.5 inline-flex h-[22px] items-center rounded-full bg-white px-[9px] text-[11px] font-semibold text-warn shadow-[0_2px_8px_rgba(11,13,18,0.14)]">
            최근 로그인
          </span>
        )}
      </Link>
      <Link href="/onboarding" className={`${pill} bg-ink text-white`}>
        Apple로 계속하기
      </Link>
      <Link href={emailHref} className={`${pill} bg-face text-label`}>
        <Icon name="mail" size={18} weight={1.7} />
        이메일로 계속하기
      </Link>
    </div>
  )
}
