// 정원 지도 데이터. 렌더링은 assets.ts·GardenScene.ts가 맡는다.

export const TILE = 32;
export const COLS = 44;
export const ROWS = 22;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

export type Terrain = 'grass' | 'path' | 'water' | 'bridge';
export type PropKind = 'tree' | 'house' | 'bench' | 'lamp' | 'pot' | 'flowerbed' | 'fence' | 'sign';

export interface Prop {
  kind: PropKind;
  col: number;
  row: number;
  /** 차지하는 칸 수 */
  w: number;
  h: number;
  blocks: boolean;
}

export interface GardenMap {
  terrain: Terrain[][];
  props: Prop[];
  blocked: boolean[][];
  spawn: { col: number; row: number };
}

export function buildMap(): GardenMap {
  const terrain: Terrain[][] = Array.from({ length: ROWS }, () => Array<Terrain>(COLS).fill('grass'));
  const props: Prop[] = [];
  const fill = (t: Terrain, c0: number, r0: number, c1: number, r1: number) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) terrain[r][c] = t;
  };
  const put = (kind: PropKind, col: number, row: number, w = 1, h = 1, blocks = true) =>
    props.push({ kind, col, row, w, h, blocks });

  // 개울과 다리
  fill('water', 30, 0, 33, ROWS - 1);
  fill('bridge', 30, 11, 33, 12);

  // 산책길: 집 앞 → 가로 길 → 다리 → 동쪽
  fill('path', 8, 6, 9, 11);
  fill('path', 4, 11, 29, 12);
  fill('path', 34, 11, 41, 12);
  fill('path', 20, 5, 21, 10);

  // 집
  put('house', 5, 1, 8, 5);
  put('pot', 4, 6);
  put('pot', 11, 6);

  // 가장자리 나무
  for (let c = 0; c < COLS; c++) {
    if (c < 30 || c > 33) {
      put('tree', c, 0);
      put('tree', c, ROWS - 1);
    }
  }
  for (let r = 1; r < ROWS - 1; r++) {
    put('tree', 0, r);
    put('tree', COLS - 1, r);
  }
  for (const [c, r] of [[2, 3], [3, 9], [1, 15], [5, 18], [24, 3], [26, 6], [25, 17], [28, 15], [38, 3], [40, 16], [36, 18], [39, 7]]) put('tree', c, r);

  // 벤치·가로등·표지판
  put('bench', 14, 9, 2, 1);
  put('lamp', 17, 10);
  put('lamp', 23, 13);
  put('lamp', 36, 10);
  put('sign', 11, 13);

  // 꽃밭과 울타리
  put('flowerbed', 14, 15, 6, 3);
  for (let c = 13; c <= 20; c++) put('fence', c, 18);
  for (let r = 15; r <= 17; r++) {
    put('fence', 13, r);
    put('fence', 20, r);
  }
  put('flowerbed', 36, 14, 3, 2);

  const blocked: boolean[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => terrain[r][c] === 'water'),
  );
  for (const p of props) {
    if (!p.blocks) continue;
    for (let r = p.row; r < p.row + p.h; r++) for (let c = p.col; c < p.col + p.w; c++) blocked[r][c] = true;
  }
  return { terrain, props, blocked, spawn: { col: 8, row: 9 } };
}

let cached: GardenMap | null = null;

/** 새 꽃을 놓을 자리: 집 근처 풀밭 중 비어 있는 가장 가까운 칸. */
export function nextDecorSlot(used: { col: number; row: number }[]): { col: number; row: number } | null {
  const map = (cached ??= buildMap());
  const taken = new Set(used.map((u) => `${u.col},${u.row}`));
  const spots: { col: number; row: number; d: number }[] = [];
  for (let row = 1; row < ROWS - 1; row++) {
    for (let col = 1; col < 29; col++) {
      if (map.blocked[row][col] || map.terrain[row][col] !== 'grass' || taken.has(`${col},${row}`)) continue;
      spots.push({ col, row, d: Math.hypot(col - 8.5, row - 7.5) });
    }
  }
  spots.sort((a, b) => a.d - b.d || a.row - b.row || a.col - b.col);
  return spots[0] ? { col: spots[0].col, row: spots[0].row } : null;
}

/** 식물을 심는 화단 칸(큰 화단 → 작은 화단 순서) */
const PLANT_TILES: { col: number; row: number }[] = [];
for (let row = 15; row <= 17; row++) for (let col = 14; col <= 19; col++) PLANT_TILES.push({ col, row });
for (let row = 14; row <= 15; row++) for (let col = 36; col <= 38; col++) PLANT_TILES.push({ col, row });

export function nextPlantSlot(used: { col: number; row: number }[]): { col: number; row: number } | null {
  return PLANT_TILES.find((t) => !used.some((u) => u.col === t.col && u.row === t.row)) ?? null;
}

/** 식물은 화단 칸에만 심을 수 있다(옮기거나 창고에서 꺼낼 때도 동일). */
export function isPlantTile(col: number, row: number): boolean {
  return PLANT_TILES.some((t) => t.col === col && t.row === row);
}

/** 소품을 옮겨 놓을 수 있는 칸인가: 풀밭이고 막혀 있지 않아야 한다. */
export function isDecorTile(col: number, row: number): boolean {
  const map = (cached ??= buildMap());
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
  return map.terrain[row][col] === 'grass' && !map.blocked[row][col];
}
