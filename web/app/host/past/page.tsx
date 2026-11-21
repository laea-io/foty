import type { Metadata } from 'next'
import Link from 'next/link'
import { HostHeadDesktop, HostHeadMobile } from '@/components/host/host-head'
import { BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Badge, ButtonLink, DemoNote, Photo } from '@/components/ui/primitives'
import { pastThemes } from '@/lib/demo/host'
import { img } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '호스트 — 지난 테마' }

function List() {
  return (
    <div className="mt-4">
      {pastThemes.map((p) => (
        <Link
          key={p.id}
          href="/themes/dasan-lunch?view=done"
          className="flex gap-3.5 border-t border-line py-[18px] text-ink no-underline first:border-t-0"
        >
          <Photo
            src={img.hanjeongsik.src}
            alt={img.hanjeongsik.alt}
            bg={img.hanjeongsik.bg}
            className="h-16 w-16 rounded-[12px]"
          />
          <div className="min-w-0 grow">
            <Badge tone={p.status === '취소' ? 'muted' : 'soft'}>{p.status}</Badge>
            <div className="mt-[5px] truncate text-[15px] font-semibold tracking-[-0.02em]">{p.title}</div>
            <div className="mt-0.5 text-[12px] text-sub">{p.when} · 다산 한정식</div>
            <div
              className={`mt-1.5 text-[12px] ${p.status === '취소' ? 'text-muted' : 'font-semibold text-ink'}`}
            >
              {p.note}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function HostPastPage() {
  return (
    <>
      <MobileFrame bottom>
        <HostHeadMobile current="/host/past" />
        <div className="px-5">
          <List />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink
              href="/host/themes/dasan-lunch/add-date"
              variant="outline"
              size="lg"
              icon="plus"
              block
            >
              같은 테마 날짜 추가
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <HostHeadDesktop current="/host/past" />
        <div className="max-w-[720px]">
          <List />
          <div className="mt-4">
            <ButtonLink href="/host/themes/dasan-lunch/add-date" variant="outline" icon="plus">
              같은 테마 날짜 추가
            </ButtonLink>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
