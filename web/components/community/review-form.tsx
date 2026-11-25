'use client'

import Link from 'next/link'
import { type ReactNode, useActionState, useState } from 'react'
import { writePostAction } from '@/app/actions/community'
import { ChipGroup, FieldLabel, SwitchRow, TextArea, TextInput } from '@/components/forms/fields'
import { ThemeMini } from '@/components/theme/cards'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { Button, Note, Photo } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'
import type { ThemeView } from '@/lib/server/queries/themes'

/** 후기 남기기 — 체크인한 테마에만. 사진은 서버에 저장된다 */
export function ReviewForm({
  t,
  id,
  inline,
}: {
  t: ThemeView
  id?: string /** 폼 안에 제출 버튼(데스크톱) */
  inline?: boolean
}) {
  const [state, send, pending] = useActionState(writePostAction, undefined)
  const [files, setFiles] = useState<string[]>([])
  return (
    <form onSubmit={keep(send)} id={id}>
      <input type="hidden" name="kind" value="여행 후기" />
      <input type="hidden" name="theme" value={t.id} />
      <input type="hidden" name="themeTitle" value={t.title} />
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

      <FieldLabel htmlFor="title">제목</FieldLabel>
      <TextInput id="title" name="title" placeholder={`${t.place}, 어땠나요?`} maxLength={60} />

      <FieldLabel>사진</FieldLabel>
      <div className="grid grid-cols-3 gap-2">
        {files.map((src) => (
          // biome-ignore lint/performance/noImgElement: 고른 사진 미리보기(blob 주소)
          <img key={src} src={src} alt="고른 사진" className="h-24 w-full rounded-[14px] object-cover" />
        ))}
        {!files.length && (
          <Photo
            src={t.image.src}
            alt={t.image.alt}
            bg={t.image.bg}
            className="h-24 w-full rounded-[14px] opacity-40"
          />
        )}
        <label className="flex h-24 cursor-pointer items-center justify-center rounded-[14px] shadow-[inset_0_0_0_1px_var(--color-line-2)]">
          <Icon name="plus" className="text-sub" />
          <span className="sr-only">사진 추가</span>
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) =>
              setFiles([...(e.target.files ?? [])].slice(0, 6).map((f) => URL.createObjectURL(f)))
            }
          />
        </label>
      </div>
      <Note className="mt-2">
        다른 사람의 얼굴이나 개인 대화가 담긴 사진은 올리기 전에 한 번 확인해 주세요.
      </Note>

      <FieldLabel htmlFor="good">좋았던 점</FieldLabel>
      <TextArea
        id="good"
        name="body"
        className="min-h-[110px]"
        placeholder="걷기 편했는지, 장소는 어땠는지 알려 주세요."
        required
      />

      <FieldLabel>이동수단</FieldLabel>
      <ChipGroup name="transport" options={['대중교통', '자차']} defaultValue="대중교통" />

      <FieldLabel htmlFor="changed" optional>
        바꾼 장소
      </FieldLabel>
      <TextArea
        id="changed"
        name="changed"
        rows={2}
        className="min-h-[70px]"
        placeholder="예: 두부 전문점 대신 숲길 밥상으로 갔어요."
      />

      <FieldLabel htmlFor="spent" optional>
        실제 지출
      </FieldLabel>
      <TextInput id="spent" name="spent" inputMode="numeric" placeholder="1인 약 18,000원" />

      <div className="mt-[22px]">
        <SwitchRow name="public" title="커뮤니티에 공개" desc="끄면 나만 볼 수 있어요" />
        <SwitchRow name="copy" title="코스 가져오기 허용" desc="다른 사람이 이 코스를 복사할 수 있어요" />
      </div>
      {state?.error && <div className="mt-4 text-[13px] text-warn">{state.error}</div>}
      {inline && (
        <div className="mt-6">
          <SubmitButton pending={pending}>후기 올리기</SubmitButton>
        </div>
      )}
    </form>
  )
}

function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {children}
    </Button>
  )
}
