# 개발 컨벤션

개발자 A(정원), B(미션 흐름), C(데이터·안전)가 함께 지킨다.
기능과 이벤트 정의는 `docs/PRD.md`를 따른다.

## Git 흐름

**GitHub Flow를 사용한다.** `main`과 짧게 유지하는 작업 브랜치만 둔다.
3명이 4주 동안 개발하므로 `develop`을 따로 관리하는 비용을 줄인다.

- 작업 브랜치는 최신 `main`에서 만든다.
- 슬라이스 하나는 브랜치 하나, PR 하나를 기본으로 한다.
- 작업은 가능하면 1~3일 안에 리뷰한다. 긴 작업은 초기에 Draft PR을 연다.
- `main`에 직접 푸시하지 않는다. 수정은 모두 PR로 반영한다.
- 리뷰 전과 머지 전에 최신 `main`으로 rebase한다.
- rebase한 작업 브랜치는 `git push --force-with-lease`로 갱신한다. 공동 작업자는 먼저 조율한다.
- `main`에는 force push를 하지 않는다.

### 테스트 배포

1. 배포할 변경을 PR로 `main`에 머지한다.
2. 해당 커밋의 `secrets`, `app` CI 성공과 실제 기기 검증을 확인한다.
3. 앱 버전과 iOS build number, Android versionCode 변경도 PR로 반영한다.
4. 최종 `main` 커밋에 `v0.1.0` 같은 버전 태그를 붙인다.
5. 태그가 가리키는 커밋에서 빌드한다. TestFlight와 Android 내부 테스트에 배포한다.
6. GitHub Release에 태그, 변경 요약, 빌드 번호, 검증 결과를 기록한다.

배포 태그는 이동하거나 재사용하지 않는다. 수정 배포는 새 버전과 새 빌드 번호를 쓴다.
현재 CI는 검사만 한다. 태그 생성이 자동 배포를 실행하지는 않는다.

## 브랜치 이름

| 작업 | 형식 | 예 |
|---|---|---|
| 슬라이스 | `s<N>-<kebab-case>` | `s0-project-base`, `s2-mission-loop` |
| 슬라이스 외 버그 수정 | `fix/<kebab-case>` | `fix/return-date` |
| 설정·도구 정리 | `chore/<kebab-case>` | `chore/expo-config` |
| 문서 | `docs/<kebab-case>` | `docs/conventions` |

## 커밋과 PR 제목

Conventional Commits를 사용한다.

`<type>(<scope>): <subject>`

| 항목 | 규칙 |
|---|---|
| type | `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci` |
| scope | `mission`, `garden`, `safety`, `onboarding`, `lib`, `db` |
| 공통 변경 | 특정 기능에 속하지 않으면 scope를 생략한다 |
| subject | 변경 내용을 짧게 쓴다. 한국어를 허용한다 |
| body | 이유와 영향 범위를 쓴다. 한국어를 허용한다 |

```text
feat(mission): 오늘은 쉬기 흐름 추가
fix(garden): 복귀 메시지 중복 표시 수정
refactor(lib): 한국 날짜 계산을 공통 함수로 이동
chore(db): 활동 테이블 RLS 정책 추가
test(safety): 긴급 연결 번호 확인
docs: 개발 컨벤션 추가
ci: 비밀 값 검사와 앱 검사 추가
```

PR 제목도 같은 형식을 쓴다. squash 커밋 제목으로 사용한다.

## PR과 리뷰

- `.github/PULL_REQUEST_TEMPLATE.md`를 사용한다.
- 하나의 목적만 담는다. 생성 파일과 lockfile을 제외하고 변경 400줄 이내를 권장한다.
- 큰 PR은 분리한다. 분리하기 어렵다면 이유와 읽을 순서를 적는다.
- 실제 기기 또는 Expo Go 확인 결과와 스크린샷을 첨부한다.
- UI가 없는 변경은 스크린샷 대신 검증 결과를 적는다.
- 작성자와 다른 역할의 개발자 1명 이상에게 리뷰를 요청한다.
- `secrets`, `app` 검사에 모두 통과해야 한다.
- **Squash merge만 사용한다.** 머지 후 작업 브랜치를 삭제한다.
- 변경이 추가되면 다시 리뷰받는다. 이전 승인을 그대로 사용하지 않는다.

### 안전·문구·개인정보 변경

긴급 연결, 안내·미션·알림 문구, 수집·저장·로그·접근 권한 변경이 대상이다.
SQL 시드의 미션 문구도 대상이다.
작성자는 `needs-all-approvals` 라벨을 붙이고 A·B·C 전원의 확인을 받는다.
미션·안내 문구는 PRD에 따라 그린테라피 검수도 받는다.

GitHub에서는 PR 작성자가 자기 PR에 Approve할 수 없다.
따라서 개발자 3명의 전원 승인은 다음처럼 기록한다.

- 작성자: 최신 변경을 확인했다는 체크리스트와 댓글.
- 나머지 두 개발자: 최신 변경에 대한 GitHub Approve.
- 머지 담당자: A·B·C 확인이 모두 있는지 점검.

새 커밋이 올라오면 이전 확인을 해제하고 다시 확인한다.
체크리스트는 PR 템플릿의 "안전·문구·개인정보" 항목을 쓴다.

CODEOWNERS는 "안전 관련 PR만 3명 승인" 같은 조건을 표현하지 못한다.
기본 보호 규칙은 승인 1개다.
전원 확인은 `needs-all-approvals` 라벨과 리뷰어 체크리스트로 운영한다.
현재 CI가 이를 자동으로 강제하지는 않는다.

## 코드

### TypeScript와 파일 이름

- TypeScript `strict: true`를 사용한다.
- `any`와 `as any`를 쓰지 않는다. 외부 입력은 `unknown`으로 받고 검증한다.
- 컴포넌트는 함수 컴포넌트와 named export를 사용한다.
- expo-router의 route와 layout은 프레임워크 규칙에 따라 default export를 사용한다.
- 스타일은 React Native `StyleSheet.create`로 정의한다.

| 위치·종류 | 이름 |
|---|---|
| `app/`의 일반 route 파일 | `mission-detail.tsx`처럼 kebab-case |
| expo-router 예약 파일·경로 | `_layout.tsx`, `index.tsx`, `[id].tsx`, `(tabs)` 등 고유 규칙 유지 |
| 컴포넌트 파일 | `MissionCard.tsx` |
| 훅 파일 | `useMission.ts` |
| 그 외 TypeScript 파일 | `missionService.ts`, `copy.ts` |
| 일반 폴더 | 소문자 kebab-case |

### 폴더와 import

```text
app/                         라우팅과 화면 연결
src/
  features/
    mission/
      components/
        MissionCard.tsx
      hooks/
        useMission.ts
      missionService.ts
      types.ts
      copy.ts
    garden/
    safety/
    onboarding/
  components/                여러 기능이 함께 쓰는 UI
  lib/
    supabase.ts
    events.ts
    date.ts
    database.types.ts
```

- 기능 코드는 `src/features/<feature>/` 안에 둔다.
- `app/`에는 라우팅과 기능 컴포넌트 연결을 중심으로 둔다.
- 공용 코드만 `src/components/`, `src/lib/`로 옮긴다.
- `@/`는 `src/`를 가리킨다. S0에서 TypeScript와 Expo 해석을 맞춘다.
- 내부 모듈 import는 `@/features/mission/...`, `@/lib/...`처럼 쓴다.
- `../../`로 기능 경계를 넘지 않는다.

### 문구, 이벤트, 날짜

- 기능별 한국어 UI 문자열은 해당 기능의 `copy.ts`에 모은다.
- route와 컴포넌트에 문구를 직접 흩어 놓지 않는다.
- 공용 UI 문자열은 `src/components/copy.ts`에 모은다.
- DB에서 제공하는 미션 문구는 `supabase/seed.sql`에서 검수한다. 앱에 중복 정의하지 않는다.
- 이벤트는 `src/lib/events.ts`의 타입이 있는 기록 함수로만 남긴다.
- 화면에서 `events` 테이블에 직접 insert하지 않는다.
- 새 이벤트나 필드는 PRD 4장을 먼저 수정한다.
- `EventName` union은 PRD 4장의 다음 이름과 정확히 일치해야 한다.

```ts
export type EventName =
  | 'app_opened'
  | 'mission_viewed'
  | 'mission_swapped'
  | 'level_lowered'
  | 'activity_completed'
  | 'rested'
  | 'returned'
  | 'stage_changed'
  | 'plan_created'
  | 'reflection_added'
  | 'emergency_opened'
  | 'emergency_called';
```

이벤트별 `props`도 타입으로 연결한다. 임의의 문자열이나 무제한 객체를 받지 않는다.
`reflection_added`에는 `activity_id`만 넣는다.

날짜와 날짜 차이는 `src/lib/date.ts`에서 계산한다.
`local_date`는 기기 시간대와 관계없이 `Asia/Seoul` 기준 `YYYY-MM-DD`로 저장한다.
`toISOString().slice(0, 10)`으로 한국 날짜를 만들지 않는다.
발생 시각인 `occurred_at`과 집계 날짜인 `local_date`를 구분한다.

**메모·회고 원문은 어떤 로그에도 남기지 않는다.**
이벤트, console, 오류 보고, 요청·응답 덤프에도 포함하지 않는다.
메모가 든 객체 전체를 로그로 출력하지 않는다. 메모 내용을 분석하지 않는다.

## Supabase

| 항목 | 규칙 |
|---|---|
| 마이그레이션 | `supabase/migrations/` |
| 파일 이름 | `<YYYYMMDDHHMMSS>_<snake_description>.sql` |
| 예 | `20261029090000_create_activities.sql` |
| 생성 | `supabase migration new create_activities` |
| 시드 | `supabase/seed.sql` |
| 생성 타입 | `src/lib/database.types.ts` |

- Supabase CLI가 만드는 타임스탬프 형식을 따른다.
- 머지된 마이그레이션은 수정하지 않는다. 새 마이그레이션으로 바로잡는다.
- 테이블을 만드는 같은 마이그레이션에서 RLS를 활성화한다.
- 필요한 정책도 함께 정의하고 접근 권한을 검증한다.
- 사용자 데이터는 `auth.uid()` 기준으로 본인 행만 접근한다.
- `missions`는 로그인한 사용자가 읽기만 한다. 앱에서는 `reviewed = true`만 노출한다.
- `events`는 앱에서 쓰기만 한다. 앱용 읽기 정책을 열지 않는다.
- 집계 뷰에 `memo`를 포함하지 않는다.
- 스키마 변경 시 생성 타입을 갱신해 함께 커밋한다. 생성 타입은 직접 편집하지 않는다.

로컬 마이그레이션 적용 후 타입 생성 예:

```sh
supabase gen types typescript --local > src/lib/database.types.ts
```

## 비밀 값

- 로컬 환경 값은 `.env`에만 둔다. Git에 커밋하지 않는다.
- `.env.example`에는 변수 이름과 빈 값만 둔다.
- `EXPO_PUBLIC_` 값은 앱 번들에 포함되는 공개 정보다.
- Supabase URL과 anon key는 `EXPO_PUBLIC_`로 사용할 수 있다.
- anon key는 비밀 키가 아니다. 데이터 보호는 RLS와 권한 정책으로 한다.
- 그래도 프로젝트 실제 설정 값은 저장소에 하드코딩하지 않는다.
- `service_role` 키는 앱, `EXPO_PUBLIC_` 변수, 저장소에 절대 넣지 않는다.
- 유출된 비밀 값은 즉시 폐기·교체한다. 커밋 삭제만으로 해결하지 않는다.

## CI와 S0 계약

워크플로 파일은 `.github/workflows/ci.yml`이다.

| 필수 상태 검사 | 내용 |
|---|---|
| `secrets` | 전체 Git 이력의 비밀 값 검사 (gitleaks 8.24.2) |
| `app` | 의존성 설치, 타입 검사, 린트, 선택적 테스트 |

S0 이전에는 `package.json`이 없으므로 `app`이 notice를 남기고 성공한다.
이는 앱 검증을 수행했다는 뜻이 아니다.

S0에서는 다음을 함께 커밋한다.

- `package.json`, `package-lock.json`
- `typecheck`, `lint` 스크립트
- TypeScript strict 설정과 `@/` alias
- 테스트가 있으면 대화형 모드 없이 종료하는 `test` 스크립트

CI는 Node.js 22와 `npm ci`를 사용한다. 로컬도 Node.js 22를 쓴다.
`package.json`이 있으면 lockfile과 필수 스크립트 누락을 실패로 처리한다.
테스트 스크립트가 없을 때만 `npm test --if-present`가 테스트를 생략한다.

## GitHub main 보호 설정

저장소 관리자가 `leten02/plant-butler`에서 설정한다.

1. **Settings → General → Pull Requests**로 이동한다.
   - **Allow squash merging**을 켠다.
   - **Allow merge commits**, **Allow rebase merging**을 끈다.
   - squash 기본 커밋 메시지는 **Pull request title**로 설정한다.
   - **Automatically delete head branches**를 켠다.
2. 먼저 CI가 실행되도록 한다. `secrets`, `app` 검사 이름이 등록됐는지 확인한다.
3. **Settings → Branches → Branch protection rules → Add classic branch protection rule**로 이동한다.
4. **Branch name pattern**에 `main`을 입력한다.
5. **Require a pull request before merging**을 켠다.
   - **Require approvals**를 켜고 **1**로 설정한다.
   - **Dismiss stale pull request approvals when new commits are pushed**를 켠다.
6. **Require status checks to pass before merging**을 켠다.
   - **Require branches to be up to date before merging**을 켠다.
   - 필수 검사로 `secrets`, `app`을 선택한다.
7. **Require linear history**를 켠다.
8. **Do not allow bypassing the above settings**를 켠다. 관리자에게도 적용한다.
9. **Allow force pushes**, **Allow deletions**는 끈 상태로 둔다.
10. **Create** 또는 **Save changes**로 저장한다.

다음은 동일한 `main` 보호 규칙을 설정하는 REST API 명령이다.
**저장소 관리자만 실행한다.**
기존 보호 규칙을 덮어쓸 수 있으므로 현재 설정을 먼저 확인한다.

```sh
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  repos/leten02/plant-butler/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["secrets", "app"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

위 보호 API는 저장소의 머지 방식까지 바꾸지는 않는다.
Squash 전용과 머지 후 브랜치 삭제는 앞의 General 설정에서 적용한다.
라벨이 있는 PR의 전원 확인도 머지 담당자가 별도로 점검한다.
