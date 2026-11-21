// 서비스 규칙 — 기획안 12장 "결정이 필요한 항목"의 기본값. 정해지면 여기만 바꾼다.
export const rules = {
  /** 최소·최대 인원 기본값 */
  defaultMin: 3,
  defaultMax: 6,
  /** 친구와 함께 신청할 때 한 신청의 최대 인원(본인 포함) */
  partyMax: 2,
  /** 신청 확정: 가게·관광지는 선착순, 주민은 수락 방식이 기본(호스트가 바꿀 수 있음) */
  confirm: { business: 'auto', resident: 'manual' } as const,
  /** 남양주 주민도 참여자로 신청할 수 있나 */
  residentsMayJoin: true,
  /** 주민 인증: 운영팀이 직접 확인 */
  residentVerify: 'admin' as const,
  /** 주요 변경 확인 기준: 전원 확인 */
  majorChangeNeeds: 'all' as const,
  /** 평가 기간(일) — 지나면 서로 제출 안 했어도 반영 */
  reviewDays: 7,
  /** 모집 마감: 여행 전날 18:00 */
  deadlineHour: 18,
  /** 행동 태그(평가 항목) */
  behaviorTags: ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요', '서로를 배려해요'],
  /** 신고 사유 */
  reportReasons: ['약속 시간 불참', '불쾌한 말이나 행동', '안전이 걱정돼요', '광고·홍보', '기타'],
}
