'use client'

import { useState } from 'react'
import { Chip } from '@/components/ui/primitives'

/** 초안 고치기 칩 — 시연에서는 고른 것만 표시된다 */
export function DraftTools() {
  const [sel, setSel] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {['덜 걷는 코스로', '카페 빼기', '장소 직접 바꾸기'].map((c) => (
          <Chip key={c} selected={sel === c} onClick={() => setSel(sel === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </div>
      {sel && (
        <div className="mt-2 text-[12px] text-sub" aria-live="polite">
          “{sel}”(으)로 다시 만들면 핵심 장소는 그대로 두고 나머지만 바꿔요.
        </div>
      )}
    </div>
  )
}
