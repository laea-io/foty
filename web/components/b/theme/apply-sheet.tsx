'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Button, Photo, Segmented } from '@/components/ui/primitives'
import type { Theme } from '@/lib/demo/themes'

/** 참여 신청: 모바일은 상세 위 바텀시트, 데스크톱은 가운데 창 */
export function ApplySheet({ t }: { t: Theme }) {
  const close = `/themes/${t.id}`
  return (
    <>
      <div className="fixed inset-0 z-40 lg:hidden">
        <Backdrop href={close} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="참여 신청"
          className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100%-40px)] max-w-[560px] flex-col rounded-t-[20px] bg-white"
        >
          <i className="mx-auto mt-2.5 block h-1 w-9 flex-none rounded-[2px] bg-line" />
          <div className="flex flex-none items-center justify-between pt-2.5 pr-2 pb-1.5 pl-5">
            <h2 className="m-0 text-[18px] font-bold tracking-[-0.03em]">참여 신청</h2>
            <Close href={close} />
          </div>
          <ApplyForm t={t} />
        </div>
      </div>

      <div className="fixed inset-0 z-40 hidden lg:block">
        <Backdrop href={close} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="참여 신청"
          className="absolute top-[140px] left-1/2 ml-[-240px] w-[480px] rounded-[20px] bg-white p-7"
        >
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.04em]">참여 신청</h2>
            <span className="-my-2 -mr-3">
              <Close href={close} />
            </span>
          </div>
          <ApplyForm t={t} wide />
        </div>
      </div>
    </>
  )
}

function ApplyForm({ t, wide }: { t: Theme; wide?: boolean }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!agreed) return
    setSending(true)
    router.push(`/themes/${t.id}/applied`)
  }
  const id = wide ? 'apply-wide' : 'apply'
  const button = (
    <Button type="submit" variant="accent" size="lg" block disabled={!agreed || sending}>
      신청 보내기
    </Button>
  )

  return (
    <form onSubmit={submit} className={wide ? '' : 'flex min-h-0 grow flex-col'}>
      <div className={wide ? 'mt-4' : 'flex min-h-0 grow flex-col gap-[22px] overflow-y-auto px-5 pt-1.5'}>
        <div className="flex items-center gap-3">
          <Photo
            src={t.image.src}
            alt={t.image.alt}
            bg={t.image.bg}
            className={`rounded-[14px] ${wide ? 'h-14 w-14' : 'h-[52px] w-[52px]'}`}
          />
          <div className="min-w-0">
            <div className={`font-semibold tracking-[-0.02em] ${wide ? 'text-[16px]' : 'text-[15px]'}`}>
              {t.title}
            </div>
            <div className={`mt-0.5 text-sub ${wide ? 'text-[13px]' : 'text-[12px]'}`}>
              {t.date} {t.start} · {t.from} 집결
            </div>
          </div>
        </div>
        <div className={wide ? 'mt-6' : ''}>
          <div className="mb-2.5 text-[14px] font-semibold">누구와 가나요?</div>
          <Segmented
            items={[
              { href: `/themes/${t.id}/apply`, label: '혼자 신청' },
              { href: `/themes/${t.id}/invite`, label: '친구와 함께 +1' },
            ]}
            current={`/themes/${t.id}/apply`}
          />
        </div>
        <div className={wide ? 'mt-6' : ''}>
          <label htmlFor={`${id}-msg`} className="block text-[14px] font-semibold">
            호스트에게 한마디 <span className="font-normal text-muted">선택</span>
          </label>
          <textarea
            id={`${id}-msg`}
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            placeholder="남양주는 처음이에요. 천천히 걷는 코스면 좋겠어요."
            className={`mt-2.5 block w-full resize-none rounded-[16px] border-0 bg-face px-4 py-3.5 text-[15px] leading-[23px] text-ink outline-none placeholder:text-muted ${
              wide ? 'h-[110px]' : 'h-24'
            }`}
          />
          <label className={`flex cursor-pointer items-start gap-2 ${wide ? 'mt-3' : 'mt-2.5'}`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-px h-[18px] w-[18px] flex-none accent-ink"
            />
            <span className="text-[12px] leading-[18px] text-muted">
              지금 신청하면 최소 인원이 채워져요. 성사되면 그룹 공간과 집결 정보가 열려요.
              {wide ? ' ' : <br />}
              성사 전에는 언제든 취소할 수 있어요.
            </span>
          </label>
        </div>
      </div>
      {wide ? (
        <div className="mt-5">{button}</div>
      ) : (
        <div
          className="flex flex-none items-center gap-2.5 px-5 pt-3"
          style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        >
          <div className="grow">{button}</div>
        </div>
      )}
    </form>
  )
}

function Backdrop({ href }: { href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 bg-[rgba(27,29,36,0.4)]"
    />
  )
}

function Close({ href }: { href: string }) {
  return (
    <Link href={href} scroll={false} aria-label="닫기" className="flex h-11 w-11 items-center justify-center">
      <Icon name="close" />
    </Link>
  )
}
