import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'

function CloseLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label="닫기"
      className="flex h-11 w-11 items-center justify-center text-sub"
    >
      <Icon name="close" />
    </Link>
  )
}

/** 모바일 바텀시트(뒤 막 rgba(27,29,36,0.4)). 닫기 = 주소 이동 */
export function MobileSheet({
  title,
  closeHref,
  children,
  footer,
}: {
  title: string
  closeHref: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <Link
        href={closeHref}
        scroll={false}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-[rgba(27,29,36,0.4)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100%-72px)] max-w-[560px] flex-col rounded-t-[20px] bg-white"
      >
        <i className="mx-auto mt-2.5 block h-1 w-9 flex-none rounded-[2px] bg-line" />
        <div className="flex flex-none items-center justify-between pt-2.5 pr-2 pb-1.5 pl-5">
          <h2 className="m-0 text-[18px] font-bold tracking-[-0.03em]">{title}</h2>
          <CloseLink href={closeHref} />
        </div>
        <div className="flex min-h-0 grow flex-col gap-[22px] overflow-y-auto px-5 pt-1.5">{children}</div>
        {footer && (
          <div
            className="flex flex-none items-center gap-2.5 px-5 pt-3"
            style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/** 데스크톱 가운데 창(참여자 더보기 등) */
export function DesktopDialog({
  title,
  closeHref,
  children,
}: {
  title: string
  closeHref: string
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40 hidden items-center justify-center lg:flex">
      <Link
        href={closeHref}
        scroll={false}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-[rgba(27,29,36,0.4)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-[420px] rounded-[20px] bg-white p-6 pt-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.03em]">{title}</h2>
          <span className="-mr-3">
            <CloseLink href={closeHref} />
          </span>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}

export { CloseLink }
