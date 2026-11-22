import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/doc'
import { ButtonLink } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '고객센터' }

const FAQ: [q: string, a: string][] = [
  [
    '테마가 성사되지 않으면 어떻게 되나요?',
    '마감 때까지 최소 인원이 모이지 않으면 테마가 자동으로 취소되고 알림으로 알려 드려요. 결제를 받지 않아서 따로 환불할 것은 없어요.',
  ],
  [
    '신청을 취소하고 싶어요.',
    '테마 화면에서 신청을 취소할 수 있어요. 성사된 뒤라면 함께 가는 사람들을 위해 대화방에 미리 알려 주세요.',
  ],
  [
    '체크인이 안 돼요.',
    '체크인은 여행 당일, 호스트가 보여 주는 QR로 해요. 화면을 새로 고쳐도 안 되면 호스트에게 말하거나 아래에서 운영팀에 알려 주세요.',
  ],
  [
    '불편한 사람이나 글을 만났어요.',
    '상대의 프로필이나 함께 가는 사람 목록에서 신고하거나 차단할 수 있어요. 신고 내용은 상대에게 공개되지 않아요.',
  ],
  [
    '호스트가 되고 싶어요.',
    '마이페이지의 호스트 신청에서 사업장 또는 남양주 주민으로 신청할 수 있어요. 운영팀이 확인한 뒤 연락드려요.',
  ],
  [
    '탈퇴하고 싶어요.',
    '아래 “운영팀에 문의하기”로 탈퇴를 요청해 주세요. 확인 후 처리하고 알림으로 알려 드려요. 지워지는 정보는 개인정보 처리 방침에 적혀 있어요.',
  ],
]

function Faq() {
  return (
    <>
      <h2 className="mt-7 mb-1 text-[17px] font-extrabold tracking-[-0.03em]">자주 묻는 질문</h2>
      {FAQ.map(([q, a]) => (
        <details key={q} className="group border-t border-line py-4">
          <summary className="flex cursor-pointer list-none items-center gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            <span className="grow">{q}</span>
            <span className="text-[18px] text-muted transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 mb-0 text-[14px] leading-[22px] text-sub">{a}</p>
        </details>
      ))}
    </>
  )
}

function Contact() {
  return (
    <div className="mt-8 rounded-[20px] bg-face p-5">
      <div className="text-[16px] font-extrabold tracking-[-0.03em]">foty 운영팀에 문의하기</div>
      <p className="mt-1.5 mb-0 text-[13px] leading-5 text-sub">
        찾는 답이 없으면 앱 안의 신고·문의 화면으로 보내 주세요. 운영팀 답변은 알림으로 와요. 로그인한 뒤에
        보낼 수 있어요.
      </p>
      <div className="mt-4">
        <ButtonLink href="/report" block>
          운영팀에 문의하기
        </ButtonLink>
      </div>
      <p className="mt-3 mb-0 text-[12px] text-muted">
        약관과 개인정보에 관한 내용은{' '}
        <Link href="/terms" className="text-muted underline">
          이용약관
        </Link>
        ·
        <Link href="/privacy" className="text-muted underline">
          개인정보 처리 방침
        </Link>
        에서 볼 수 있어요.
      </p>
    </div>
  )
}

export default function SupportPage() {
  return (
    <LegalPage path="/support" title="고객센터" sub="궁금한 점이나 불편한 점을 알려 주세요.">
      <Faq />
      <Contact />
    </LegalPage>
  )
}
