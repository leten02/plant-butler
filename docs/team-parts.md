# 파트 나누기와 작업 약속

## 폴더가 곧 파트
| 파트 | 폴더·파일 | 하는 일 |
|---|---|---|
| 이야기 | `src/core/data/story.json`, `core/story.ts`, `ui/panels/Story.tsx` | 장면을 json에 더하면 재생된다. 대사·선택·기억. 연결 오류와 금지어는 테스트가 잡는다 |
| 규칙·경제 | `src/core/rules.ts`, `economy.ts`, `stats.ts`, `demo.ts`, `tests/` | 씨앗·성장·수확·열매·상점·선물 규칙. 화면을 모르는 순수 TypeScript라서 테스트로 지킨다 |
| 문구·스토리 | `src/core/copy.ts`, `data/*.json` | 모든 화면 문구, 주민 대사, 활동·식물 데이터. 금지어 테스트가 막아 준다 |
| 정원 화면 | `src/scene/` | 배경·이동·충돌·카메라·주민 서성임·식물 성장 모습·꾸미기 드래그 |
| 화면 UI | `src/ui/` | React 패널·HUD·모달. 새 화면은 `panels/`에 |
| 그림 | `art/`, `tools/slice_art.py`, `public/assets/` | 원본은 `art/`, 게임이 쓰는 그림은 도구가 `public/assets`로 잘라 만든다 |

같은 파일을 두 사람이 고치지 않도록 파트별로 파일이 나뉘어 있다. `copy.ts`와 `types.ts`만 여럿이 건드리므로 작게 자주 합친다.

## 작업 약속
- 규칙을 바꾸면 `src/tests/`의 테스트를 먼저 고친다. `npm test`, `npm run build`가 통과해야 한다.
- 문구는 `copy.ts`에만 쓴다. 금지어(우울·증상·치료·상담 등)와 칭찬·압박 표현은 테스트가 막는다.
- 앱 원칙은 `CLAUDE.md`의 "절대 어기지 말 것"을 따른다(연속 기록·벌점·시듦·남은 일수 표시 없음).
- 저장되는 데이터 모양을 바꾸면 `store.ts`의 `loadState`가 이전 저장본을 읽어 오는지 확인한다.
- `public/assets`의 그림은 직접 고치지 않고 `art/` 원본을 바꾼 뒤 `python3 tools/slice_art.py`로 다시 만든다.
- 화면 확인은 `tools/screenshot.mjs`(헤드리스 Chrome)로 할 수 있다. 사용법은 `CLAUDE.md`.

## 아직 비어 있는 곳(이어서 할 일)
- 주민 3종·정원열매·씨앗·새싹·모루 작업대·선물함 그림(지금은 임시 표시). 교체는 `scene/assets.ts`와 `scene/Npc.ts`, `ui/panels/Talk.tsx`의 `NpcBadge`.
- 쉬는 모습 새싹이 그림(다른 그림체).
- 스토리 본편(지도판), 서브 스토리, 페르소나 대화.
- PWA 오프라인 캐시, 소리, 서버(저장·로그인)는 팀 결정 후.
