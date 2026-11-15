import raw from './data/plants.json';

export type PlantPattern =
  | 'fluff' | 'droop' | 'leaf3' | 'rays8' | 'rays12' | 'umbrella'
  | 'disc' | 'spike' | 'cup' | 'trumpet' | 'bell-small' | 'bell-trumpet';

export interface Plant {
  id: string;
  name: string;
  icon: string;
  petal: string;
  center: string;
  pattern: PlantPattern;
  /** 특별 씨앗(외형이 다를 뿐, 열매는 똑같이 맺는다) */
  rare?: boolean;
  /** 열매나무: 마당에 심고, 수확해도 남아서 다시 열매를 맺는다 */
  tree?: boolean;
}

export const plants = raw as unknown as Plant[];

export function plantById(id: string): Plant | undefined {
  return plants.find((p) => p.id === id);
}

export function isTree(id: string): boolean {
  return !!plantById(id)?.tree;
}

/** 씨앗 종류별 확률(합). 나머지는 일반 꽃. 임시값이고 확률은 화면에 보여 주지 않는다. */
export const RARE_CHANCE = 0.15;
export const TREE_CHANCE = 0.3;

/** 씨앗 하나를 랜덤으로 뽑는다. 같은 종류 안에서는 모두 같은 확률이고, 중복도 정상이다. */
export function drawPlant(rand: () => number = Math.random, rareOnly = false): Plant {
  const roll = rareOnly ? 0 : rand();
  const pool = plants.filter((p) => (roll < RARE_CHANCE ? p.rare : roll < RARE_CHANCE + TREE_CHANCE ? p.tree : !p.rare && !p.tree));
  return pool[Math.floor(rand() * pool.length)];
}
