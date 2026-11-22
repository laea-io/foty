import 'server-only'
// AI 도우미 — OpenAI가 "검토된 장소 후보" 안에서만 고른다(기획안 원칙 3·5: 실시간 검색·지어낸 장소 없음).
// 키가 없거나, 늦거나, 후보 밖 id를 내면 null → 부르는 쪽이 규칙 기반으로 돌아간다.
import { env } from '@/lib/env'

export type AiCandidate = {
  id: string
  name: string
  kind: string
  group: string
  area: string
  indoor: boolean
  cost: number
  checked: boolean
}

export type AiPick = { ids: string[]; label: string; reason: string }

const SYSTEM = `너는 남양주 당일 여행 서비스 foty의 코스 도우미다.
- 반드시 주어진 후보 목록의 id 안에서만 고른다. 목록에 없는 장소를 만들거나 추천하지 않는다.
- 요청에 맞는 후보가 없으면 ids를 빈 배열로 둔다. 억지로 고르지 않는다.
- 핵심 장소는 바뀌지 않는다. 고른 곳은 핵심 장소 앞뒤에 붙는 곳이다.
- checked=false인 곳은 운영 정보를 아직 확인하지 못한 곳이니 꼭 필요할 때만 고른다.
- label: 고른 곳들을 묶어 부르는 짧은 말(예: "실내 장소", "조용한 카페", "아이와 갈 곳"). 8자 안팎.
- reason: 왜 골랐는지 한 문장, 존댓말(~예요/~해요). 영업시간·가격 같은 사실을 지어내지 않는다.`

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ids: { type: 'array', items: { type: 'string' } },
    label: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['ids', 'label', 'reason'],
}

// 같은 요청을 다시 그릴 때 또 부르지 않게(서버 메모리, 1시간)
const cache = new Map<string, { at: number; v: AiPick | null }>()
const TTL = 60 * 60 * 1000

export const aiEnabled = () => !!env.OPENAI_API_KEY

export async function aiPick(input: {
  ask: string
  core: { name: string; kind: string; area: string }
  candidates: AiCandidate[]
  n: number
  purpose: 'swap' | 'draft'
}): Promise<AiPick | null> {
  if (!env.OPENAI_API_KEY || !input.ask.trim() || !input.candidates.length) return null
  const key = JSON.stringify([
    input.purpose,
    input.ask,
    input.core.name,
    input.n,
    input.candidates.map((c) => c.id),
  ])
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit.v

  const task =
    input.purpose === 'draft'
      ? `하루 코스 초안을 만든다. 핵심 장소 앞뒤에 붙일 곳을 ${input.n}곳까지 고른다. 식사나 카페가 하나는 들어가면 좋다.`
      : `지금 코스에 더하거나 바꿀 대안을 ${input.n}곳까지, 잘 맞는 순서로 고른다.`
  const user = [
    `요청: ${input.ask.slice(0, 200)}`,
    `핵심 장소: ${input.core.name} (${input.core.kind}, ${input.core.area})`,
    task,
    `후보(JSON): ${JSON.stringify(input.candidates)}`,
  ].join('\n')

  let v: AiPick | null = null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'pick', strict: true, schema } },
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`OpenAI ${res.status}`)
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const out = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as Partial<AiPick>
    const allowed = new Set(input.candidates.map((c) => c.id))
    // 후보 밖 id·중복은 버린다 — 지어낸 장소가 화면에 나올 길을 막는다
    const ids = [...new Set((out.ids ?? []).filter((id) => allowed.has(id)))].slice(0, input.n)
    v = {
      ids,
      label: String(out.label ?? '').slice(0, 20),
      reason: String(out.reason ?? '').slice(0, 160),
    }
  } catch (e) {
    console.warn('[foty] AI 도우미 실패 — 규칙으로 돌아감:', e instanceof Error ? e.message : e)
    return null // 실패는 캐시하지 않는다
  }
  if (cache.size > 300) cache.delete(cache.keys().next().value as string)
  cache.set(key, { at: Date.now(), v })
  return v
}
