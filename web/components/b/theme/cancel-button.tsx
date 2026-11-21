'use client'

import { useActionState } from 'react'
import { cancelAction } from '@/app/actions/b-themes'
import { Button } from '@/components/ui/primitives'

type Variant = 'primary' | 'accent' | 'outline' | 'soft'

/** 신청 취소(성사 전) — 성공하면 취소 완료 화면으로. 실패 문장은 버튼 위에 */
export function CancelButton({
  themeId,
  label = '신청 취소',
  variant = 'outline',
  size = 'lg',
  className,
}: {
  themeId: string
  label?: string
  variant?: Variant
  size?: 'lg' | 'md' | 'sm'
  className?: string
}) {
  const [state, action, pending] = useActionState(cancelAction, undefined)
  return (
    <form action={action} className={className}>
      <input type="hidden" name="themeId" value={themeId} />
      {state?.error && <div className="mb-2 text-[13px] text-warn">{state.error}</div>}
      <Button type="submit" variant={variant} size={size} block disabled={pending}>
        {label}
      </Button>
    </form>
  )
}
