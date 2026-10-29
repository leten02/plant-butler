# 오늘 한걸음

상담·치료를 마친 사람이 일과를 놓친 다음 날 다시 시작하도록 돕는 게임형 일상 회복 지원 앱.
가천대 Tech for Impact 3팀 식물집사 · 멘토기관 그린테라피.

> 이 앱은 진단·상담·치료를 하지 않습니다. 위기 상황에서는 109(자살예방상담) 또는 1577-0199(정신건강위기상담)로 연락하세요.

## 문서

- [PRD](docs/PRD.md): 범위, 용어, 이벤트 사전, 지표, 화면별 완료 조건
- [작업 단위 명세](docs/slices/): Codex가 구현할 슬라이스별 명세 (S0부터)
- [개발 컨벤션](docs/CONVENTIONS.md): 깃 플로우, 커밋·PR 규칙, 코드 규칙, CI
- [개발 계획서](docs/notion-plan.md): 역할 분담, 일정, 작업 규칙 (노션에도 같은 내용)
- [서비스 기획서](https://claude.ai/artifact/NzWckAZavug2FuwvZcMN9p)

## 폴더 구조

```
app/                 expo-router 화면
src/features/
  mission/           미션 흐름, 2·3단계 계획 (B)
  garden/            정원, 꽃, 복귀 메시지, 기록 (A)
  safety/            긴급 연결 (C)
  onboarding/        처음 시작 (C)
src/lib/             Supabase 클라이언트, 이벤트 기록, 날짜 유틸 (C)
src/components/      공용 UI
assets/              픽셀 에셋, 폰트
supabase/migrations/ 테이블·RLS SQL
supabase/seed.sql    미션 시드
docs/                PRD, 개발 계획서
```

## 실행 방법

S0(프로젝트 뼈대) 작업이 끝나면 아래 순서로 실행합니다.

1. Node.js 22 설치
2. 의존성 설치: `npm install`
3. `.env.example`을 `.env`로 복사하고 Supabase URL과 anon key 입력 (팀 채널에서 받기, 커밋 금지)
4. 실행: `npx expo start` → 휴대폰 Expo Go 앱으로 QR 스캔
5. 확인: `npm run typecheck`, `npm run lint`

## 작업 방식

1. 이슈에서 슬라이스를 고르고 브랜치 생성: `git switch -c s2-mission-loop`
2. 구현 후 실제 기기에서 확인
3. PR 생성 → 다른 역할의 개발자 1명 리뷰 (안전·문구·개인정보 관련은 `needs-all-approvals` 라벨 + 3명 확인)
4. CI(`secrets`, `app`) 통과 후 squash merge
