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

/** 로그인 버튼 세 개(카카오 · Apple · 이메일). 카카오는 /api/auth/kakao(라우트 핸들러라 <a>) */
export function LoginButtons({
  recent,
  next,
  notice,
}: {
  recent?: boolean
  next: string
  /** 준비 중 안내(카카오·Apple 키가 없을 때) */
  notice?: string
}) {
  const q = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <div className="flex w-full flex-col gap-2.5">
      <a href={`/api/auth/kakao${q}`} className={`${pill} bg-kakao text-[#191600]`}>
        <KakaoIcon />
        카카오로 3초만에 시작하기
        {recent && (
          <span className="absolute -top-[9px] right-3.5 inline-flex h-[22px] items-center rounded-full bg-white px-[9px] text-[11px] font-semibold text-warn shadow-[0_2px_8px_rgba(11,13,18,0.14)]">
            최근 로그인
          </span>
        )}
      </a>
      <Link href={`/login?apple=off${q ? `&${q.slice(1)}` : ''}`} className={`${pill} bg-ink text-white`}>
        Apple로 계속하기
      </Link>
      <Link href={`/login/email${q}`} className={`${pill} bg-face text-label`}>
        <Icon name="mail" size={18} weight={1.7} />
        이메일로 계속하기
      </Link>
      {notice && (
        <p role="status" className="m-0 text-center text-[13px] text-warn">
          {notice}
        </p>
      )}
    </div>
  )
}

const DEMO_ACCOUNTS: [handle: string, label: string][] = [
  ['kanghyun', '강현 · 참여자'],
  ['dasan-owner', '다산 한정식 · 호스트'],
  ['harin', '하린 · 주민 호스트'],
  ['admin', '운영팀'],
]

/** 스테이징 시연: 시연 계정으로 바로 들어가기(DEMO_MODE=1에서만 보인다) */
export function DemoLogin({ action, next }: { action: (form: FormData) => Promise<void>; next: string }) {
  return (
    <form action={action} className="mt-7 w-full border-t border-line pt-5 text-center">
      <div className="text-[12px] text-muted">시연 계정으로 보기</div>
      {next !== '/' && <input type="hidden" name="next" value={next} />}
      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
        {DEMO_ACCOUNTS.map(([h, label]) => (
          <button
            key={h}
            type="submit"
            name="as"
            value={h}
            className="inline-flex h-9 items-center rounded-full border-0 bg-face px-3.5 text-[13px] font-medium text-label"
          >
            {label}
          </button>
        ))}
      </div>
    </form>
  )
}
