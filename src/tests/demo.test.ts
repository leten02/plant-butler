import { plants } from '../core/plants';
import { describe, expect, it } from 'vitest';
import { shiftDate } from '../core/clock';
import { addTestSeeds, fillSample } from '../core/demo';
import { canHarvest, giftAvailable } from '../core/economy';
import { DAILY_LIMIT } from '../core/rules';
import { createState } from '../core/store';
import { directPlanRatio } from '../core/stats';

const TODAY = '2026-10-26';
const slots = {
  decor: (used: unknown[]) => ({ col: used.length % 20, row: 7 + Math.floor(used.length / 20) }),
  plant: (used: unknown[]) => ({ col: used.length % 20, row: 15 + Math.floor(used.length / 20) }),
};
const sample = () => {
  const s = createState();
  fillSample(s, TODAY, slots);
  return s;
};

describe('fillSample', () => {
  it('지난 2주 안의 기록만 만들고 오늘은 비워 둔다', () => {
    const s = sample();
    expect(s.logs.length).toBeGreaterThan(8);
    for (const l of s.logs) {
      expect(l.date < TODAY).toBe(true);
      expect(l.date >= shiftDate(TODAY, -14)).toBe(true);
    }
    expect(s.days[TODAY]).toBeUndefined();
  });

  it('하루 3개 상한을 지키고, 쉰 날에는 기록이 없다', () => {
    const s = sample();
    const perDay = new Map<string, number>();
    for (const l of s.logs) perDay.set(l.date, (perDay.get(l.date) ?? 0) + 1);
    for (const n of perDay.values()) expect(n).toBeLessThanOrEqual(DAILY_LIMIT);
    for (const [date, d] of Object.entries(s.days)) if (d.rested) expect(perDay.get(date) ?? 0).toBe(0);
  });

  it('식물이 심겨 있고, 최근 이틀의 주머니는 열지 않은 채 남는다', () => {
    const s = sample();
    expect(s.garden.plants.length).toBeGreaterThan(3);
    const ready = Object.entries(s.days).filter(([, d]) => d.packet === 'ready').map(([date]) => date);
    for (const date of ready) expect(date >= shiftDate(TODAY, -2)).toBe(true);
  });

  it('열매 12개와 놓아 둔 소품 2개가 있고, 시연할 때 딸 수 있는 꽃이 하나 이상 남는다', () => {
    const s = sample();
    expect(s.fruit).toBe(12);
    expect(s.garden.items.map((i) => i.kind)).toEqual(['bench', 'flowerpot']);
    expect(s.garden.plants.some((p) => canHarvest(p, TODAY, s.days))).toBe(true);
    expect(s.garden.storage.some((p) => p.type === 'plant' && p.harvested)).toBe(true); // 딴 꽃은 창고에 있다
  });

  it('방문 선물은 오늘 것을 아직 받지 않은 상태이고, 직접 계획도 일부 섞인다', () => {
    const s = sample();
    expect(giftAvailable(s, TODAY)).toBe(true);
    expect(s.visits.count).toBe(4);
    expect(directPlanRatio(s.logs)).toBeGreaterThan(0);
    expect(s.logs.some((l) => l.source === 'daily')).toBe(true);
  });

  it('같은 입력이면 같은 결과이고, 다시 채워도 쌓이지 않는다', () => {
    const a = sample();
    const again = structuredClone(a);
    fillSample(again, TODAY, slots);
    expect(again).toEqual(a);
  });

  it('시험용 씨앗은 씨앗함에 들어가고 심을 수 있는 식물이다', () => {
    const s = createState();
    addTestSeeds(s, 5);
    expect(s.seeds).toHaveLength(5);
    expect(new Set(s.seeds.map((x) => x.id)).size).toBe(5);
    expect(s.seeds.every((x) => plants.some((p) => p.id === x.plantId))).toBe(true);
    expect(s.seeds.some((x) => plants.find((p) => p.id === x.plantId)?.tree)).toBe(true); // 나무도 시험할 수 있게
    expect(s.garden.plants).toHaveLength(0);
  });
});
