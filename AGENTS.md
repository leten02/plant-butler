# AGENTS.md

오늘 한걸음 (plant-butler). 상담·치료를 마친 지 6개월 이내 성인이 일상을 다시 시작하도록 돕는 게임형 앱의 4주 시범 운영용 첫 버전. Expo (React Native, TypeScript, expo-router) + Supabase.

## 작업 전에 읽을 것

1. `docs/slices/S<N>.md`: 지금 구현할 작업 단위 명세. **이 파일이 작업 범위다.**
2. `docs/PRD.md`: 용어, 이벤트 사전(4장), 데이터(5장), 화면별 완료 조건(7장)
3. `docs/CONVENTIONS.md`: 브랜치, 커밋, PR, 파일 이름, 코드 규칙, Supabase 규칙
4. `CLAUDE.md`: 핵심 원칙과 금지 목록 (아래에 요약)

## 역할

- 기획과 명세는 Claude가 `docs/`에 쓴다. Codex는 명세대로 구현한다.
- `docs/**`, `CLAUDE.md`, `AGENTS.md`는 고치지 않는다. 명세가 틀렸거나 모호하면 구현을 멈추지 말고 가장 보수적인 쪽으로 구현한 뒤, PR 본문의 "명세 질문"에 적는다.
- 명세에 없는 기능, 화면, 이벤트, 테이블 컬럼을 추가하지 않는다.

## 절대 넣지 않는 것

- 연속 기록(스트릭), 빨간 미완료 배지, 시드는 식물 같은 벌칙 연출, 순위 비교
- 기분 점수, 앱이나 AI가 마음 상태를 판단·해석하는 기능
- 진단·상담·치료 문구, 재발 예방 효과 주장
- 이름·전화번호·이메일·진단명 입력란
- 메모·회고 원문을 로그·이벤트·console·오류 보고에 남기거나 분석하는 코드
- "해야 한다", "왜 안 했어요", "실패", "놓쳤어요" 같은 압박·판단 문구

## 꼭 지킬 것

- 이벤트는 `src/lib/events.ts`의 타입 있는 함수로만 기록한다. 이름과 필드는 PRD 4장과 정확히 같아야 한다.
- 날짜는 `src/lib/date.ts`로 Asia/Seoul 기준 `local_date`(`YYYY-MM-DD`)를 만든다.
- 모든 테이블은 같은 마이그레이션에서 RLS를 켠다. 머지된 마이그레이션은 고치지 않는다.
- 비밀 값은 커밋하지 않는다. `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`만 `.env`로 쓴다. `service_role` 키는 어디에도 넣지 않는다.
- TypeScript strict, `any` 금지, `@/` alias는 `src/`.

## 작업 방식

- 브랜치: `s<N>-<kebab-case>` (예: `s0-project-base`). `main`에 직접 커밋·푸시하지 않는다.
- 커밋과 PR 제목: Conventional Commits (`feat(lib): 이벤트 기록 함수 추가`). 한국어 subject 허용.
- 끝내기 전에 `npm run typecheck`, `npm run lint`가 통과해야 한다.
- PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md`를 채우고, 명세의 완료 조건을 하나씩 체크한다. 확인하지 못한 항목은 체크하지 말고 이유를 적는다.
