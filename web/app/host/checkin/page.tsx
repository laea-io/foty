import type { Metadata } from 'next'
import { DemoQr } from '@/components/host/demo-qr'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, Badge, Button, DemoNote } from '@/components/ui/primitives'
import { hostThemes } from '@/lib/demo/host'

export const metadata: Metadata = { title: '호스트 — 체크인' }

const t = hostThemes.matched
const members = [
  { name: '유나', at: '14:02 체크인', done: true },
  { name: '지호', at: '14:05 체크인', done: true },
  { name: '도현', at: '아직 체크인하지 않았어요', done: false },
]

function Qr({ size }: { size: number }) {
  return (
    <div className="flex flex-col items-center pt-2.5 text-center">
      <div className="text-[13px] text-sub">
        {t.date} {t.start}
      </div>
      <div className="mt-0.5 text-[19px] font-extrabold tracking-[-0.03em]">{t.title}</div>
      <div className="mt-5 rounded-[20px] p-[22px] shadow-[inset_0_0_0_1px_var(--color-line)]">
        <DemoQr size={size} />
      </div>
      <div className="mt-3 text-[12px] text-muted">참여자가 이 QR을 찍으면 방문이 확인돼요 · 시연용 QR</div>
    </div>
  )
}

function Members() {
  return (
    <>
      <div className="mt-7 mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">참여자</h2>
        <span className="text-[12px] text-sub">
          {members.filter((m) => m.done).length} / {members.length}명 체크인
        </span>
      </div>
      {members.map((m) => (
        <div key={m.name} className="flex items-center gap-3 border-t border-line py-[13px]">
          <Avatar name={m.name} size={36} />
          <div className="grow">
            <div className="text-[15px] font-semibold">{m.name}</div>
            <div className="text-[12px] text-sub">{m.at}</div>
          </div>
          <Badge tone={m.done ? 'ink' : 'muted'}>{m.done ? '체크인 완료' : '확인 대기'}</Badge>
        </div>
      ))}
      <div className="mt-3.5">
        <Button variant="outline" block className="h-12">
          QR 없이 직접 확인하기
        </Button>
      </div>
    </>
  )
}

export default function HostCheckinPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="체크인" back="/host" />
        <div className="px-5">
          <Qr size={196} />
          <Members />
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start justify-center gap-16">
          <div className="w-[420px]">
            <Qr size={300} />
          </div>
          <div className="w-[420px]">
            <Members />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
