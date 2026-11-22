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
  /** AI 도우미(OpenAI). 없으면 규칙 기반으로만 고른다 */
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.4-mini'),
  /** 카카오맵 JavaScript 키(브라우저에 보이는 값 — 카카오 개발자 콘솔에서 도메인으로 제한) · REST 키(서버) */
  KAKAO_JS_KEY: z.string().optional(),
  KAKAO_REST_KEY: z.string().optional(),
  /** 카카오 로그인 Client Secret(콘솔에서 켰을 때만) */
  KAKAO_CLIENT_SECRET: z.string().optional(),
  /** 비밀번호 찾기 메일(Resend). 없으면 운영팀이 재설정 링크를 만들어 전한다 */
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  /** 스테이징 시연: 시연 계정으로 바로 들어가기 · 아무 날짜에나 체크인 */
  DEMO_MODE: z.enum(['1', '0']).default('0'),
  /** 후기 사진 저장 폴더 */
  UPLOAD_DIR: z.string().default('./uploads'),
  /** 정해진 시각마다 상태 넘기기(마감·자동 취소·완료) */
  JOBS: z.enum(['1', '0']).default('1'),
})

export const env = schema.parse(process.env)

/** 서버가 뜰 때(instrumentation) 부른다 — 빌드 중에는 검사하지 않는다 */
export function assertRuntimeEnv() {
  if (env.NODE_ENV === 'production' && env.AUTH_SECRET.startsWith('dev-only') && env.DEMO_MODE !== '1')
    throw new Error('AUTH_SECRET을 운영 값으로 넣어 주세요')
}
