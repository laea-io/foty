// 로그인 화면 버튼: 카카오 로그인(/api/auth/kakao — 라우트 핸들러라 <a>) · 시연 계정(스테이징 DEMO_MODE=1에서만)

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width={18} height={18} className="flex-none">
      <path
        fill="#191600"
        d="M12 4C7.03 4 3 7.13 3 11c0 2.5 1.68 4.69 4.2 5.93l-.86 3.13c-.08.29.25.52.5.35l3.73-2.47c.47.05.94.06 1.43.06 4.97 0 9-3.13 9-7s-4.03-7-9-7z"
      />
    </svg>
  )
}

/** 카카오로 시작하기 */
export function KakaoButton({ next }: { next: string }) {
  const q = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <a
      href={`/api/auth/kakao${q}`}
      className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-kakao text-[15px] font-semibold text-[#191600] no-underline"
    >
      <KakaoIcon />
      카카오로 시작하기
    </a>
  )
}

/** 카카오와 이메일 사이 구분선 */
export function OrLine() {
  return (
    <div className="my-6 flex items-center gap-3 text-[12px] text-muted">
      <span className="h-px grow bg-line" />
      또는 이메일로
      <span className="h-px grow bg-line" />
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
