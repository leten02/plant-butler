// 발표용 샘플 데이터: 지난 2주치 기록과 자란 정원. 오늘은 비워 두어 시연자가 직접 해볼 수 있다.
import { activities } from './activities';
import { shiftDate } from './clock';
import { harvest } from './economy';
import { isTree, plants } from './plants';
import { rng } from './random';
import { addSeed, chooseRest, completePlan, defaultPlanInfo, designPlan, openPacket, pastItems, plantSeed, setEnergy, setPlan, WHEN_OPTIONS } from './rules';
import type { AppState, Plan, ReflectChip } from './types';

type Slot = { col: number; row: number } | null;
export interface SampleSlots {
  decor: (used: { col: number; row: number }[]) => Slot;
  plant: (used: { col: number; row: number }[]) => Slot;
}

const WISHES: [string, string][] = [
  ['좋아하는 공원 다녀오기', '공원 입구까지 가보기'],
  ['동네 한 바퀴 돌기', '골목 끝까지 가보기'],
  ['책방 구경하기', '한 권만 펼쳐보기'],
];
const CHIPS: ReflectChip[] = ['achieved', 'easier', 'again'];

type Rand = () => number;
const pick = <T>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)];

function samplePlan(draft: AppState, r: Rand, ago: number, used: Set<string>): Plan | null {
  const when = pick(r, WHEN_OPTIONS);
  const roll = r();
  if (ago <= 7 && roll < 0.3) {
    const [text, criterion] = pick(r, WISHES);
    if (!used.has(`text:${text}`)) {
      used.add(`text:${text}`);
      return designPlan(text, when, criterion);
    }
  }
  const past = pastItems(draft);
  if (ago <= 10 && roll < 0.6 && past.length > 0) {
    const p = pick(r, past);
    if (!used.has(p.key)) {
      used.add(p.key);
      const info = { when, where: p.where || '집 근처', minutes: p.minutes, ...(p.criterion ? { criterion: p.criterion } : {}) };
      return { activityId: p.activityId, text: p.text, info, source: 'daily' };
    }
  }
  // 처음엔 작은 활동 위주, 시간이 지나며 조금 큰 활동도 섞인다.
  const pool = activities.filter((a) => a.minutes <= (ago > 10 ? 5 : 30) && !used.has(a.id));
  if (pool.length === 0) return null;
  const a = pick(r, pool);
  used.add(a.id);
  return { activityId: a.id, info: defaultPlanInfo(a, when), source: 'mission' };
}

/** 기존 정원·기록을 비우고 지난 14일치를 채운다. 안 한 날은 그냥 비어 있다. */
/** 시험용: 씨앗함에 씨앗을 넣는다. 나무 하나를 먼저 넣고, 나머지는 도감 앞쪽부터 차례로라 특별 씨앗도 섞인다. */
export function addTestSeeds(draft: AppState, count: number): void {
  const trees = plants.filter((p) => p.tree);
  addSeed(draft, trees[draft.seeds.length % trees.length].id);
  for (let i = 1; i < count; i++) addSeed(draft, plants[(draft.seeds.length + i * 2) % plants.length].id);
}

export function fillSample(draft: AppState, today: string, slots: SampleSlots): void {
  draft.logs = [];
  draft.garden = { items: [], plants: [], storage: [] };
  draft.days = {};
  draft.bonusPackets = 0;
  draft.freePackets = 0;
  draft.seeds = [];
  draft.purchases = 0;
  draft.story.seen = ['intro', 'free-packet']; // 시연은 프롤로그 뒤부터
  const r = rng(20261026);

  for (let ago = 14; ago >= 1; ago--) {
    const date = shiftDate(today, -ago);
    const roll = r();
    if (roll < 0.15) {
      setEnergy(draft, date, 'heavy');
      chooseRest(draft, date);
    } else if (roll < 0.32) {
      continue; // 아무것도 안 한 날: 기록도 표시도 남기지 않는다.
    } else {
      setEnergy(draft, date, pick(r, ['heavy', 'normal', 'normal', 'good'] as const));
      const count = 1 + Math.floor(r() * (ago <= 7 ? 3 : 2));
      const used = new Set<string>();
      for (let i = 0; i < count; i++) {
        const plan = samplePlan(draft, r, ago, used);
        if (!plan || !setPlan(draft, date, plan)) continue;
        const chips = CHIPS.filter(() => r() < 0.4);
        completePlan(draft, date, chips);
      }
    }
    // 최근 이틀의 봉투는 열지 않은 채 두어, 시연 때 직접 열어볼 수 있게 한다.
    if (draft.days[date]?.packet === 'ready' && ago > 2) {
      const seed = openPacket(draft, date, r)!;
      const used = [...draft.garden.plants, ...draft.garden.items];
      const planted = plantSeed(draft, seed.id, date, isTree(seed.plantId) ? slots.decor(used) : slots.plant(used));
      // 오래전에 핀 꽃 중 일부는 열매를 이미 따서 창고에 있고, 최근에 핀 꽃은 남겨 둬서 시연 때 직접 딸 수 있게 한다.
      if (planted && ago >= 8 && r() < 0.6) harvest(draft, planted.id, today);
    }
  }
  // 열매는 이미 모아 둔 만큼(상점을 바로 시연할 수 있게), 소품 둘은 이미 사서 놓아 둔 것으로 한다.
  draft.fruit = 12;
  for (const kind of ['bench', 'flowerpot'] as const) {
    const slot = slots.decor([...draft.garden.items, ...draft.garden.plants]);
    if (slot) draft.garden.items.push({ id: `sample-${kind}`, kind, variant: 0, ...slot });
  }
  // 방문 선물함: 접속한 날은 4번이고 오늘 것은 아직 받지 않은 상태.
  draft.visits = { count: 4, last: shiftDate(today, -1) };
}
