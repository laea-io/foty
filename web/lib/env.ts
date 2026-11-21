import 'server-only'
import { z } from 'zod'

// 서버 환경변수는 여기 한 곳에서만 읽는다. 빠지면 시작할 때 바로 죽어서 알 수 있게.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  // cortie-db는 TLS 필수. 로컬 개발용 postgres는 끈다.
  DATABASE_SSL: z.enum(['require', 'disable']).default('require'),
  MIGRATE_ON_START: z.enum(['1', '0']).default('1'),
  APP_URL: z.string().url().default('http://localhost:4060'),
  /** 체크인 QR 서명·초대 토큰용 비밀값(32자 이상). 개발 기본값은 운영에서 쓰지 않는다 */
  AUTH_SECRET: z.string().min(32).default('dev-only-secret-change-me-0123456789abcdef'),
  /** 카카오 로그인(없으면 카카오 버튼은 "준비 중") */
  KAKAO_REST_KEY: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  /** 스테이징 시연: 시연 계정으로 바로 들어가기 · 아무 날짜에나 체크인 */
  DEMO_MODE: z.enum(['1', '0']).default('0'),
  /** 후기 사진 저장 폴더 */
  UPLOAD_DIR: z.string().default('./uploads'),
  /** 정해진 시각마다 상태 넘기기(마감·자동 취소·완료) */
  JOBS: z.enum(['1', '0']).default('1'),
})

export const env = schema.parse(process.env)

if (env.NODE_ENV === 'production' && env.AUTH_SECRET.startsWith('dev-only') && env.DEMO_MODE !== '1') {
  throw new Error('AUTH_SECRET을 운영 값으로 넣어 주세요')
}
