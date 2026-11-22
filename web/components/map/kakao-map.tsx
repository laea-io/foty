'use client'

// 카카오맵 — 코스 장소를 번호 순서대로 찍고 점선으로 잇는다.
// 키가 없거나, 좌표가 없거나, SDK가 실패하면(도메인 미등록 등) children(약도 그림)이 그대로 보인다.
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'

const KeyCtx = createContext<string | undefined>(undefined)

/** 루트 레이아웃이 서버 env의 KAKAO_JS_KEY를 내려 준다(빌드에 굽지 않는다) */
export function KakaoKeyProvider({ value, children }: { value?: string; children: ReactNode }) {
  return <KeyCtx.Provider value={value}>{children}</KeyCtx.Provider>
}

export type MapPoint = { name: string; lat?: number | null; lng?: number | null }

// biome-ignore lint/suspicious/noExplicitAny: 카카오 SDK에는 타입이 없다
type Kakao = any
declare global {
  interface Window {
    kakao?: Kakao
  }
}

let loading: Promise<Kakao> | null = null
function loadSdk(key: string): Promise<Kakao> {
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao)
  loading ??= new Promise<Kakao>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    s.async = true
    s.onload = () =>
      window.kakao?.maps ? window.kakao.maps.load(() => resolve(window.kakao)) : reject(new Error('sdk'))
    s.onerror = () => reject(new Error('sdk'))
    document.head.appendChild(s)
  }).catch((e) => {
    loading = null
    throw e
  })
  return loading
}

function pin(n: number, name: string, fixed: boolean) {
  const el = document.createElement('div')
  el.title = name
  el.setAttribute('aria-label', `${n}. ${name}`)
  el.style.cssText = [
    'width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center',
    `background:${fixed ? '#ff6a3d' : '#0b0d12'};color:#fff;font:600 13px/1 inherit`,
    'box-shadow:0 0 0 3px #fff,0 2px 8px rgba(11,13,18,.25)',
  ].join(';')
  el.textContent = String(n)
  return el
}

export function KakaoMap({
  points,
  fixedIndex,
  className,
  children,
}: {
  points: MapPoint[]
  /** 핵심 장소(주황) */
  fixedIndex?: number
  className?: string
  /** 지도를 못 그릴 때 보이는 약도 */
  children: ReactNode
}) {
  const key = useContext(KeyCtx)
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const pts = points.filter((p): p is Required<MapPoint> & { lat: number; lng: number } => !!p.lat && !!p.lng)
  const sig = JSON.stringify(pts.map((p) => [p.lat, p.lng]))

  // biome-ignore lint/correctness/useExhaustiveDependencies: 좌표(sig)가 바뀔 때만 다시 그린다
  useEffect(() => {
    if (!key || !pts.length || !box.current) return
    let gone = false
    loadSdk(key)
      .then((kakao) => {
        if (gone || !box.current) return
        const { maps } = kakao
        const path = pts.map((p) => new maps.LatLng(p.lat, p.lng))
        const map = new maps.Map(box.current, { center: path[0], level: 6 })
        map.setZoomable(false) // 페이지 스크롤을 지도가 가로채지 않게 — 확대는 버튼으로
        map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT)
        if (path.length > 1)
          new maps.Polyline({
            map,
            path,
            strokeWeight: 3,
            strokeColor: '#0b0d12',
            strokeOpacity: 0.8,
            strokeStyle: 'shortdot',
          })
        const bounds = new maps.LatLngBounds()
        pts.forEach((p, i) => {
          new maps.CustomOverlay({
            map,
            position: path[i],
            content: pin(points.indexOf(p) + 1, p.name, points.indexOf(p) === fixedIndex),
            yAnchor: 0.5,
          })
          bounds.extend(path[i])
        })
        if (path.length > 1) map.setBounds(bounds, 40, 40, 40, 40)
        setReady(true)
      })
      .catch(() => setReady(false))
    return () => {
      gone = true
    }
  }, [key, sig, fixedIndex])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {children}
      {key && pts.length > 0 && (
        <div
          ref={box}
          role="img"
          aria-label={`코스 지도: ${points.map((p) => p.name).join(' → ')}`}
          className={`absolute inset-0 transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
