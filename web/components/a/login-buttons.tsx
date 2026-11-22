// 시연 계정 버튼(스테이징 DEMO_MODE=1에서만). 카카오·Apple 로그인은 2026-11-22에 뺐다 — 이메일 로그인만.

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
