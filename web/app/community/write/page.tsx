import type { Metadata } from 'next'
import Link from 'next/link'
import { ChipGroup, FieldLabel, SwitchRow, TextArea, TextInput } from '@/components/c/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeMini } from '@/components/theme/cards'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { ButtonLink, DemoNote, Note, Photo } from '@/components/ui/primitives'
import { img, themeById, themes } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '후기 남기기' }

function Form({ themeId }: { themeId: string }) {
  const t = themeById(themeId) ?? themes[4]
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">후기 남기기</h1>
      <ThemeMini t={t} className="mt-4" />
      <div className="mt-3 flex items-center gap-3 rounded-[16px] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <Mascot size={40} />
        <div className="grow">
          <div className="text-[14px] font-bold">{t.place} 스탬프</div>
          <div className="mt-px text-[12px] text-sub">
            체크인으로 확인된 방문이에요 · 후기에 함께 표시돼요
          </div>
        </div>
        <Link href="/my/stamps" className="text-[13px] font-semibold text-ink no-underline">
          스탬프북 ›
        </Link>
      </div>

      <FieldLabel>사진</FieldLabel>
      <div className="grid grid-cols-3 gap-2">
        <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="h-24 w-full rounded-[14px]" />
        <Photo
          src={img.bongseonsa.src}
          alt={img.bongseonsa.alt}
          bg={img.bongseonsa.bg}
          className="h-24 w-full rounded-[14px]"
        />
        <label className="flex h-24 cursor-pointer items-center justify-center rounded-[14px] shadow-[inset_0_0_0_1px_var(--color-line-2)]">
          <Icon name="plus" className="text-sub" />
          <span className="sr-only">사진 추가</span>
          <input type="file" accept="image/*" className="sr-only" />
        </label>
      </div>
      <Note className="mt-2">
        다른 사람의 얼굴이나 개인 대화가 담긴 사진은 올리기 전에 한 번 확인해 주세요.
      </Note>

      <FieldLabel htmlFor="good">좋았던 점</FieldLabel>
      <TextArea
        id="good"
        className="min-h-[110px]"
        defaultValue="전나무길이 평지라 걷기 편했고, 점심 장소가 조용해서 좋았어요."
      />

      <FieldLabel>이동수단</FieldLabel>
      <ChipGroup options={['대중교통', '자차']} defaultValue="대중교통" />

      <FieldLabel htmlFor="changed" optional>
        바꾼 장소
      </FieldLabel>
      <TextArea
        id="changed"
        rows={2}
        className="min-h-[70px]"
        defaultValue="두부 전문점 대신 숲길 밥상으로 갔어요."
      />

      <FieldLabel htmlFor="spent" optional>
        실제 지출
      </FieldLabel>
      <TextInput id="spent" inputMode="numeric" defaultValue="1인 약 18,000원" />

      <div className="mt-[22px]">
        <SwitchRow title="커뮤니티에 공개" desc="끄면 나만 볼 수 있어요" />
        <SwitchRow title="코스 가져오기 허용" desc="다른 사람이 이 코스를 복사할 수 있어요" />
      </div>
    </>
  )
}

export default async function WriteReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const themeId = (await searchParams).theme ?? 'gwangneung-morning'
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="후기" back="/trips/past" />
        <div className="px-5">
          <Form themeId={themeId} />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/community/dumulmeori-quiet" size="lg" block>
              후기 올리기
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">후기</div>
          <Form themeId={themeId} />
          <div className="mt-6">
            <ButtonLink href="/community/dumulmeori-quiet" size="lg" block>
              후기 올리기
            </ButtonLink>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
