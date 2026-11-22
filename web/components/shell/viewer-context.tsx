'use client'

// 로그인한 사람의 이름·안 읽은 알림 수 — 루트 레이아웃(서버)이 내려 주고, 상단 바가 읽는다
import { createContext, type ReactNode, useContext } from 'react'

export type ViewerBrief = { name: string; unread: number } | null

const Ctx = createContext<ViewerBrief>(null)

export function ViewerProvider({ value, children }: { value: ViewerBrief; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useViewerBrief = () => useContext(Ctx)
