import type { Metadata } from 'next'
import Link from 'next/link'
import QRCode from 'qrcode'
import { manualCheckinAction } from '@/app/actions/host'
import { ActionForm } from '@/components/forms/locked-form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, Badge, Button, DemoNote } from '@/components/ui/primitives'
import { env } from '@/lib/env'
import { requireHost } from '@/lib/server/auth/session'
import { checkinUrl } from '@/lib/server/auth/tokens'
import { checkinBoard } from '@/lib/server/queries/host'

export const metadata: Metadata = { title: '호스트 — 체크인' }

export default async function HostCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const v = await requireHost('/host/checkin')
  const board = await checkinBoard(v.host.id, (await searchParams).theme)
  if (!board) {
    const empty = (
      <div className="py-16 text-center">
        <div className="text-[18px] font-bold">체크인할 테마가 없어요</div>
        <div className="mt-1.5 text-[13px] text-sub">
          성사된 테마가 있으면 여행 날 여기서 QR을 보여 주세요.
        </div>
        <Link href="/host" className="mt-5 inline-block text-[14px] font-semibold text-ink">
          내 테마로 ›
        </Link>
      </div>
    )
    return (
      <>
        <MobileFrame>
          <BackBar title="체크인" back="/host" />
          <div className="px-5">{empty}</div>
        </MobileFrame>
        <DesktopFrame>{empty}</DesktopFrame>
      </>
    )
  }
  const { theme: t, members } = board
  const url = checkinUrl(t.id, t.day)
  // 실제로 읽히는 QR — 참여자가 휴대폰 카메라로 찍으면 /c/<토큰>이 열린다(서명이 맞는 이 테마·이 날짜만)
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    color: { dark: '#0b0d12', light: '#ffffff' },
  })
  const qr = (size: number) => (
    <div className="flex flex-col items-center pt-2.5 text-center">
      <div className="text-[13px] text-sub">
        {t.date} {t.start}
      </div>
      <div className="mt-0.5 text-[19px] font-extrabold tracking-[-0.03em]">{t.title}</div>
      <div className="mt-5 rounded-[20px] p-[22px] shadow-[inset_0_0_0_1px_var(--color-line)]">
        <div
          role="img"
          aria-label="체크인 QR"
          style={{ width: size, height: size }}
          className="[&_svg]:h-full [&_svg]:w-full"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: qrcode 라이브러리가 만든 SVG(외부 입력 아님)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div className="mt-3 text-[12px] text-muted">
        참여자가 이 QR을 찍으면 방문이 확인돼요{env.DEMO_MODE === '1' ? ' · 시연용 QR' : ''}
      </div>
    </div>
  )
  const list = (
    <>
      <div className="mt-7 mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">참여자</h2>
        <span className="text-[12px] text-sub">
          {members.filter((m) => m.done).length} / {members.length}명 체크인
        </span>
      </div>
      {members.map((m) => (
        <div key={m.userId} className="flex items-center gap-3 border-t border-line py-[13px]">
          <Avatar name={m.name} size={36} />
          <div className="grow">
            <div className="text-[15px] font-semibold">{m.name}</div>
            <div className="text-[12px] text-sub">{m.at}</div>
          </div>
          {m.done ? (
            <Badge tone="ink">체크인 완료</Badge>
          ) : (
            <ActionForm id={`chk-${m.userId}`} action={manualCheckinAction}>
              <input type="hidden" name="theme" value={t.id} />
              <input type="hidden" name="user" value={m.userId} />
              <Button type="submit" variant="outline" size="sm" className="h-9">
                직접 확인
              </Button>
            </ActionForm>
          )}
        </div>
      ))}
      <div className="mt-3 text-[12px] leading-[18px] text-muted">
        QR을 찍기 어려운 참여자는 &lsquo;직접 확인&rsquo;으로 방문을 확인해 주세요. 체크인과 호스트 확인이
        어긋나면 운영팀이 검토해요.
      </div>
    </>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title="체크인" back="/host" />
        <div className="px-5">
          {qr(196)}
          {list}
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start justify-center gap-16">
          <div className="w-[420px]">{qr(300)}</div>
          <div className="w-[420px]">{list}</div>
        </div>
      </DesktopFrame>
    </>
  )
}
