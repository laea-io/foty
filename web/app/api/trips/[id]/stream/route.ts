// 그룹 대화 실시간: Server-Sent Events. 새 글을 넣을 때 NOTIFY foty_chat '<테마 id>'를 보내고,
// 여기서는 postgres.js의 LISTEN(연결 하나를 모든 구독이 같이 쓴다)으로 받아 그 뒤에 온 글을 내려 준다.
// 다시 연결할 때는 ?since=<마지막 글 시각>부터 따라잡는다(빠진 글 없음, 같은 글은 화면에서 id로 거른다).
// LISTEN이 실패하면 'fallback' 이벤트를 보내고, 화면은 ?once=1로 4초마다 묻는다.
import { db, sql as pg } from '@/lib/db'
import { getViewer } from '@/lib/server/auth/session'
import { groupIds } from '@/lib/server/domain/changes'
import { CHAT_CHANNEL } from '@/lib/server/domain/trips'
import { chatMessages } from '@/lib/server/queries/trips'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getViewer()
  if (!viewer) return new Response('login required', { status: 401 })
  const group = await groupIds(db, id).catch(() => [] as string[])
  if (!group.includes(viewer.id)) return new Response('forbidden', { status: 403 })

  const sp = new URL(req.url).searchParams
  const raw = sp.get('since')
  let since = raw ? new Date(raw) : new Date()
  if (Number.isNaN(since.getTime())) since = new Date()
  // LISTEN이 안 될 때 화면이 몇 초마다 묻는 길(?once=1 → 그 뒤 글 JSON)
  if (sp.get('once') === '1')
    return Response.json(await chatMessages(id, viewer.id, since), {
      headers: { 'Cache-Control': 'no-store' },
    })

  const enc = new TextEncoder()
  let closed = false
  let ping: ReturnType<typeof setInterval> | undefined
  let unlisten: (() => Promise<void>) | undefined
  const sent = new Set<string>()

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const close = () => {
        if (closed) return
        closed = true
        if (ping) clearInterval(ping)
        unlisten?.().catch(() => {})
        try {
          ctrl.close()
        } catch {
          /* 이미 닫힘 */
        }
      }
      const send = (chunk: string) => {
        if (closed) return
        try {
          ctrl.enqueue(enc.encode(chunk))
        } catch {
          close()
        }
      }
      // 알림이 몰려도 순서대로 한 번씩만 읽는다
      let queue = Promise.resolve()
      const flush = () => {
        queue = queue.then(async () => {
          if (closed) return
          try {
            const rows = await chatMessages(id, viewer.id, since)
            for (const m of rows) {
              if (sent.has(m.id)) continue
              sent.add(m.id)
              send(`id: ${m.at}\ndata: ${JSON.stringify(m)}\n\n`)
              // 시각이 미래인 글(시연 데이터)이 있어도 기준은 지금을 넘기지 않는다
              const now = new Date()
              const at = new Date(m.at)
              const t = at < now ? at : now
              if (t > since) since = t
            }
          } catch (e) {
            console.error('[foty] chat stream', e)
          }
        })
      }
      req.signal.addEventListener('abort', close)
      send('retry: 3000\n\n')
      try {
        const l = await pg.listen(CHAT_CHANNEL, (payload) => {
          if (payload === id) flush()
        })
        unlisten = l.unlisten
        if (closed) await l.unlisten()
      } catch (e) {
        console.error('[foty] chat listen', e)
        send('event: fallback\ndata: poll\n\n')
      }
      flush()
      ping = setInterval(() => send(': ping\n\n'), 25_000)
    },
    cancel() {
      closed = true
      if (ping) clearInterval(ping)
      unlisten?.().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
