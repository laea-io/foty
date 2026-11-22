import type { Metadata } from 'next'
import { PageTitle } from '@/components/a/form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote, Photo } from '@/components/ui/primitives'
import { type Img, img } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '사진 출처' }

// 디자인 「사진 출처」 그대로 — 문구를 바꾸지 않는다.
const credits: [Img, string, string][] = [
  [img.sujongsa, '수종사 대웅보전', 'Sadopaul · CC BY-SA 4.0 · Wikimedia Commons'],
  [img.bongseonsa, '남양주 봉선사', 'An Yeonggwan · 공공누리 1유형 · Wikimedia Commons'],
  [img.dumulmeori, '양수리 두물머리 03', 'S h y numis · CC BY-SA 4.0 · Wikimedia Commons'],
  [img.boat, '양수리 두물머리 06', 'S h y numis · CC BY-SA 4.0 · Wikimedia Commons'],
  [img.forest, '국립수목원 전나무숲 01', 'Pulpitara · CC BY-SA 3.0 · Wikimedia Commons'],
  [img.trail, '국립수목원 숲생태 관찰로', 'Pulpitara · CC BY-SA 3.0 · Wikimedia Commons'],
  [img.yeoyudang, '여유당 (Yeoyudang2)', '촬영자 표기 없음 · CC BY-SA 3.0 · Wikimedia Commons'],
  [img.hanjeongsik, 'Korean cuisine-Hanjeongsik-03', 'egg (Hong, Yun Seon) · CC BY 2.0 · Wikimedia Commons'],
  [img.byeollae, 'Korea 2015', 'jillllybean · CC BY-SA 2.0 · Wikimedia Commons'],
  [img.cafe, '신길문화체육도서관 1층 카페', 'Striker9498 · CC0 · Wikimedia Commons'],
]

function Body({ columns }: { columns?: boolean }) {
  return (
    <>
      <PageTitle sub="foty에 나오는 사진과 장소 정보를 어디서 가져왔는지 적어 둬요.">사진 출처</PageTitle>
      <h2 className="mt-6 mb-0 text-[17px] font-extrabold tracking-[-0.03em]">장소 사진·정보</h2>
      <div className="mt-2 text-[13px] leading-[20px] text-sub">
        장소의 사진·주소·영업시간·메뉴·소개는 한국관광공사 TourAPI(국문 관광정보 서비스)에서 받았어요. 사진은
        공공누리 제1유형(출처 표시) 또는 제3유형(출처 표시 + 변경 금지) 조건이라 원본 그대로 보여 줘요.
        영업시간은 바뀔 수 있으니 가기 전에 한 번 더 확인해 주세요.
      </div>
      <div className="mt-2 text-[12px] text-muted">출처: 한국관광공사 · 공공데이터포털(data.go.kr)</div>
      <h2 className="mt-8 mb-0 text-[17px] font-extrabold tracking-[-0.03em]">시안 사진</h2>
      <div className="mt-2 text-[12px] leading-[18px] text-muted">
        아래는 시안에 쓴 위키미디어 공용 사진이에요. 카페와 한정식 사진은 남양주가 아닌 곳의 사진이에요.
      </div>
      <div className={`mt-[18px] ${columns ? 'columns-2 gap-14' : ''}`}>
        {credits.map(([p, title, by]) => (
          <div key={title} className="flex break-inside-avoid items-center gap-3.5 border-t border-line py-3">
            <Photo src={p.src} alt={p.alt} bg={p.bg} className="h-16 w-16 rounded-[12px]" />
            <div>
              <div className="text-[15px] font-semibold">{title}</div>
              <div className="mt-0.5 text-[12px] text-sub">{by}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function CreditsPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="사진 출처" back="/my" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[960px]">
          <Body columns />
        </div>
      </DesktopFrame>
    </>
  )
}
