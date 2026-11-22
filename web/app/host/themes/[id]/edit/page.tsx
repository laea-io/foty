import type { Metadata } from 'next'
import { editThemeAction } from '@/app/actions/host-edit'
import { Field, Stepper, TextInput } from '@/components/c/form'
import { ActionForm } from '@/components/host/action-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeMini } from '@/components/theme/cards'
import { Button, Note } from '@/components/ui/primitives'
import { ownTheme } from '@/lib/server/q/own'
import type { ThemeView } from '@/lib/server/q/themes'

export const metadata: Metadata = { title: '테마 정보 고치기' }

function Body({ t, id }: { t: ThemeView; id: string }) {
  return (
    <ActionForm id={id} action={editThemeAction}>
      <input type="hidden" name="theme" value={t.id} />
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        테마 정보 고치기
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        날짜·핵심 시간처럼 일정이 바뀌는 건 그룹 공간에서 변경 제안으로 해요.
      </div>
      <ThemeMini t={t} className="mt-4" />
      <div className="mt-[22px] flex flex-col gap-[22px]">
        <Field label="제목" htmlFor={`${id}-title`}>
          <TextInput id={`${id}-title`} name="title" defaultValue={t.title} maxLength={40} required />
        </Field>
        <Field label="소개" htmlFor={`${id}-intro`}>
          <TextInput id={`${id}-intro`} name="intro" defaultValue={t.intro} maxLength={200} />
        </Field>
        <Field label="포함" htmlFor={`${id}-include`}>
          <TextInput id={`${id}-include`} name="include" defaultValue={t.include} maxLength={120} />
        </Field>
        <Field label="불포함" htmlFor={`${id}-exclude`}>
          <TextInput id={`${id}-exclude`} name="exclude" defaultValue={t.exclude} maxLength={120} />
        </Field>
        <Field label="최대 인원">
          <Stepper
            name="max"
            label={`지금 ${t.current}명 · 최소 ${t.min}명`}
            value={t.max}
            min={Math.max(t.min, t.current)}
            max={12}
          />
        </Field>
        <Field label="예상 비용(1인)" htmlFor={`${id}-cost`}>
          <TextInput
            id={`${id}-cost`}
            name="cost"
            inputMode="numeric"
            defaultValue={String(t.costWon)}
            disabled={t.matched}
          />
          {t.matched && <input type="hidden" name="cost" value={String(t.costWon)} />}
        </Field>
      </div>
      {t.matched && <Note className="mt-4">성사된 뒤라 예산은 그룹 공간에서 변경 제안으로 바꿔 주세요.</Note>}
    </ActionForm>
  )
}

export default async function EditThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await ownTheme(id, `/host/themes/${id}/edit`)
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="테마 정보" back={`/host/themes/${t.id}/space`} />
        <div className="px-5 pb-6">
          <Body t={t} id="edit-m" />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="edit-m" size="lg" block>
              저장하기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[560px]">
          <Body t={t} id="edit-d" />
          <Button type="submit" form="edit-d" size="lg" block className="mt-8">
            저장하기
          </Button>
        </div>
      </DesktopFrame>
    </>
  )
}
