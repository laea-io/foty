import { readImage } from '@/lib/server/uploads'

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const f = await readImage((await params).name)
  if (!f) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(f.body), {
    headers: {
      'content-type': f.type,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  })
}
