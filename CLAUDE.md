# 오늘 한걸음 (plant-butler)

가천대 Tech for Impact 3팀 식물집사. 상담·치료를 마친 지 6개월 이내 성인이 일상을 다시 시작하도록 돕는 게임형 앱의 4주 시범 운영용 첫 버전.

- 기능 정의·이벤트 사전·완료 조건: `docs/PRD.md`
- 역할·일정·작업 규칙: `docs/notion-plan.md`
- 작업 단위 명세: `docs/slices/S<N>.md` (Claude가 쓰고 Codex가 구현. Codex 규칙은 `AGENTS.md`)

## 핵심 원칙

- 바꾸려는 행동은 하나: **놓친 다음 날 다시 시작하기**. 기능은 이 행동을 쉽게 만드는지로 판단한다.
- 중단에 불이익이 없다. 정원은 시들지 않고, 밀린 과제가 쌓이지 않는다.
- 정원에는 현실에서 한 활동만 반영한다.

## 절대 넣지 않는 것

- 연속 기록(스트릭), 빨간 미완료 배지, 벌칙 연출, 순위 비교
- 기분 점수, AI나 앱이 마음 상태를 판단·해석하는 기능
- 진단·상담·치료 문구, 재발 예방 효과 주장
- 이름·전화번호·이메일·진단명 등 개인정보 입력란
- 메모·회고 내용을 분석하는 코드

## 기술

- Expo (React Native, TypeScript, expo-router), Reanimated
- Supabase: 익명 로그인, Postgres, RLS. 마이그레이션은 `supabase/migrations`
- 게임 엔진 없음. 정원은 고정 배경 + 꽃 스프라이트 배치
- 알림은 expo-notifications 로컬 예약 알림 (푸시 서버 없음)
- 날짜는 항상 Asia/Seoul 기준 `local_date`로 저장

## 코드 규칙

- 이벤트는 `src/lib/events.ts`의 타입과 기록 함수로만 남긴다. 새 이벤트는 `docs/PRD.md` 4장에 먼저 추가한다.
- 모든 테이블에 RLS를 켠다. 사용자 데이터는 본인 행만 읽고 쓴다. 예외: `missions`는 로그인 사용자 읽기 전용, `events`는 앱에서 쓰기만 한다.
- 비밀 값은 커밋하지 않는다. `.env`만 쓰고 `.env.example`에 키 이름만 둔다.
- 긴급 연결 번호는 앱에 내장한다 (네트워크 없이 동작).
- 작업은 슬라이스 단위 브랜치(`s2-mission-loop`)와 PR로 한다. `main`에 직접 푸시하지 않는다.
- 커밋·브랜치·PR·파일 이름 규칙은 `docs/CONVENTIONS.md`를 따른다.
