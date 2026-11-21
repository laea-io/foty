import type { Metadata } from 'next'
import { ChipGroup, FieldLabel, TextArea, TextInput } from '@/components/c/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '질문하기' }

function Form() {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        무엇이 궁금한가요?
      </h1>
      <FieldLabel>종류</FieldLabel>
      <ChipGroup options={['여행 후기', '코스 공유', '질문']} defaultValue="질문" />
      <FieldLabel htmlFor="title">제목</FieldLabel>
      <TextInput id="title" defaultValue="운길산역에서 수종사까지 얼마나 걸리나요?" />
      <FieldLabel htmlFor="body">내용</FieldLabel>
      <TextArea
        id="body"
        className="min-h-[140px]"
        defaultValue="오르막이 꽤 있다고 들었는데 운동화로 충분할까요?"
      />
      <FieldLabel optional>관련 장소</FieldLabel>
      <ChipGroup options={['수종사', '운길산역', '+ 장소 추가']} defaultValue="수종사" multiple />
      <Note className="mt-4">개인 연락처나 다른 사람의 얼굴이 담긴 사진은 올리지 말아 주세요.</Note>
    </>
  )
}

export default function AskPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="질문하기" back="/community" />
        <div className="px-5">
          <Form />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/community?kind=질문" size="lg" block>
              질문 올리기
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">질문하기</div>
          <Form />
          <div className="mt-6">
            <ButtonLink href="/community?kind=질문" size="lg" block>
              질문 올리기
            </ButtonLink>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
