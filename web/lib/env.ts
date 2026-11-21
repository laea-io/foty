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
})

export const env = schema.parse(process.env)
