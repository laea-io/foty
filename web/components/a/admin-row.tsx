'use client'

import { useState } from 'react'
import { Avatar, Badge, Button, ButtonLink } from '@/components/ui/primitives'
import type { AdminItem } from '@/lib/demo/admin'

/** 운영팀 할 일 한 줄 — 처리 버튼을 누르면 배지만 바뀐다(시연) */
export function AdminRow({ it }: { it: AdminItem }) {
  const [done, setDone] = useState<0 | 1 | null>(null)
  const badge = done === null ? it.badge : (it.after?.[done] ?? it.badge)
  const [main, sub] = it.actions
  return (
    <div className="border-t border-line py-4">
      <div className="flex items-center gap-3">
        <Avatar name={it.name} size={40} />
        <div className="min-w-0 grow">
          <div className="text-[15px] font-bold">{it.name}</div>
          <div className="mt-0.5 text-[12px] text-sub">{it.line}</div>
        </div>
        <Badge tone={badge[0]}>{badge[1]}</Badge>
      </div>
      <div className="mt-3 flex gap-2">
        {sub === undefined ? (
          <ButtonLink href={it.href ?? '#'} variant="outline" size="sm" className="flex-1">
            {main}
          </ButtonLink>
        ) : done !== null ? (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setDone(null)}>
            되돌리기
          </Button>
        ) : (
          <>
            <Button size="sm" className="flex-1" onClick={() => setDone(0)}>
              {main}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setDone(1)}>
              {sub}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
