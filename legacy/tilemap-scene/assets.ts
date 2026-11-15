// 그래픽의 유일한 출입구. 지금은 코드로 그린 플레이스홀더를 만든다.
// Kenney(CC0) 등 PNG로 바꿀 때는 이 파일의 텍스처 키만 preload한 이미지로 대체하면 된다.
import Phaser from 'phaser';
import { rng } from '../core/random';
import { COLS, ROWS, TILE, type PropKind, type Terrain } from './map';
import { plants } from '../core/plants';

type Ctx = CanvasRenderingContext2D;

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  tex.refresh();
}

const rect = (c: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};
/** 모서리를 깎은 픽셀풍 덩어리 */
const blob = (c: Ctx, color: string, x: number, y: number, w: number, h: number, cut = 3) => {
  rect(c, color, x + cut, y, w - cut * 2, h);
  rect(c, color, x, y + cut, w, h - cut * 2);
  rect(c, color, x + 1, y + 1, w - 2, h - 2);
};

export function generateAssets(scene: Phaser.Scene, terrain: Terrain[][]): void {
  makeProps(scene);
  makePlants(scene);
  bakeTerrain(scene, terrain);
}

function makeProps(scene: Phaser.Scene): void {
  const flowerColors = ['#f4a3b0', '#ffd95a', '#ffffff', '#a8b8f0'];
  flowerColors.forEach((col, i) =>
    make(scene, `decor_flower${i}`, 32, 32, (c) => {
      rect(c, '#3f8a35', 15, 14, 2, 14);
      rect(c, '#58b857', 10, 20, 5, 3);
      rect(c, '#58b857', 17, 17, 5, 3);
      rect(c, col, 11, 6, 10, 10);
      rect(c, col, 14, 3, 4, 16);
      rect(c, '#ff9a5a', 14, 9, 4, 4);
    }),
  );
  make(scene, 'decor_bench', 32, 32, (c) => {
    rect(c, '#5d3d1f', 5, 22, 4, 8);
    rect(c, '#5d3d1f', 23, 22, 4, 8);
    rect(c, '#8a6238', 2, 14, 28, 9);
    rect(c, '#a9743c', 2, 14, 28, 3);
    rect(c, '#8a6238', 4, 6, 24, 7);
    rect(c, '#a9743c', 4, 6, 24, 2);
  });
  const props: Record<PropKind, [number, number, (c: Ctx) => void]> = {
    tree: [32, 56, (c) => {
      rect(c, '#6b4a2b', 13, 36, 6, 20);
      rect(c, '#8a6238', 13, 36, 2, 20);
      blob(c, '#2f7a34', 2, 4, 28, 38, 5);
      blob(c, '#3f9a42', 5, 7, 20, 26, 4);
      blob(c, '#58b857', 8, 10, 8, 8, 2);
    }],
    house: [256, 160, (c) => {
      rect(c, '#f3e6c8', 24, 84, 208, 76);
      rect(c, '#d9c9a0', 24, 148, 208, 12);
      for (const x of [24, 90, 160, 226]) rect(c, '#6b4a2b', x, 84, 6, 76);
      rect(c, '#6b4a2b', 24, 120, 208, 4);
      for (let y = 0; y < 86; y++) {
        const half = 56 + (y / 86) * 72;
        rect(c, y % 12 < 6 ? '#a9743c' : '#945f2e', 128 - half, y, half * 2, 1);
        rect(c, '#5d3d1f', 128 - half, y, 2, 1);
        rect(c, '#5d3d1f', 128 + half - 2, y, 2, 1);
      }
      rect(c, '#5d3d1f', 0, 84, 256, 4);
      rect(c, '#6b4a2b', 106, 100, 44, 60);
      rect(c, '#8a6238', 110, 104, 36, 56);
      rect(c, '#d9b36a', 140, 132, 3, 3);
      for (const x of [44, 188]) {
        rect(c, '#6b4a2b', x - 2, 100, 32, 30);
        rect(c, '#9ad0f0', x, 102, 28, 26);
        rect(c, '#6b4a2b', x + 13, 102, 2, 26);
        rect(c, '#6b4a2b', x, 114, 28, 2);
        rect(c, '#8a6238', x - 4, 130, 36, 8);
        for (let i = 0; i < 4; i++) rect(c, ['#f4a3b0', '#ffd95a', '#ffffff', '#f4a3b0'][i], x + i * 8, 126, 5, 5);
      }
    }],
    bench: [64, 32, (c) => {
      rect(c, '#5d3d1f', 4, 24, 6, 8);
      rect(c, '#5d3d1f', 54, 24, 6, 8);
      rect(c, '#8a6238', 2, 12, 60, 12);
      rect(c, '#a9743c', 2, 12, 60, 4);
      rect(c, '#8a6238', 4, 2, 56, 8);
      rect(c, '#a9743c', 4, 2, 56, 3);
    }],
    lamp: [32, 64, (c) => {
      rect(c, '#3a3a3a', 14, 18, 4, 46);
      rect(c, '#3a3a3a', 10, 58, 12, 6);
      rect(c, '#3a3a3a', 8, 6, 16, 4);
      rect(c, '#ffd95a', 10, 10, 12, 10);
      rect(c, '#fff3b0', 12, 12, 4, 4);
      rect(c, '#3a3a3a', 10, 20, 12, 3);
    }],
    pot: [32, 32, (c) => {
      rect(c, '#c8693a', 8, 18, 16, 12);
      rect(c, '#a9532c', 6, 16, 20, 4);
      rect(c, '#58b857', 10, 8, 12, 9);
      for (const [x, y, col] of [[9, 6, '#f4a3b0'], [15, 3, '#ffd95a'], [20, 7, '#ffffff']] as const) rect(c, col, x, y, 4, 4);
    }],
    // 빈 화단: 심어진 식물(plant_*)이 올라오기 전까지는 흙만 보여 "모은 것"과 헷갈리지 않는다.
    flowerbed: [192, 96, (c) => {
      blob(c, '#5d3d1f', 2, 6, 188, 88, 6);
      blob(c, '#7a5230', 6, 10, 180, 80, 5);
      for (let row = 0; row < 6; row++) rect(c, '#6b4527', 10, 16 + row * 12, 170, 2);
      const r = rng(7);
      for (let i = 0; i < 40; i++) {
        const x = 10 + Math.floor(r() * 170);
        const y = 14 + Math.floor(r() * 70);
        rect(c, r() < 0.5 ? '#8a6238' : '#5d3d1f', x, y, 2, 2);
      }
    }],
    fence: [32, 32, (c) => {
      rect(c, '#ece3cf', 3, 10, 6, 20);
      rect(c, '#ece3cf', 23, 10, 6, 20);
      rect(c, '#d3c7aa', 3, 26, 6, 4);
      rect(c, '#d3c7aa', 23, 26, 6, 4);
      rect(c, '#ece3cf', 0, 14, 32, 4);
      rect(c, '#ece3cf', 0, 22, 32, 4);
    }],
    sign: [32, 40, (c) => {
      rect(c, '#5d3d1f', 14, 14, 4, 26);
      rect(c, '#8a6238', 3, 4, 26, 14);
      rect(c, '#a9743c', 3, 4, 26, 4);
      rect(c, '#5d3d1f', 8, 11, 16, 2);
    }],
  };
  for (const [kind, [w, h, draw]] of Object.entries(props)) make(scene, `prop_${kind}`, w, h, draw);
}

/** 도감 식물: 종마다 다른 실루엣(꽃잎 배열)으로 그려 한눈에 구별되게 한다. */
function makePlants(scene: Phaser.Scene): void {
  for (const p of plants) {
    make(scene, `plant_${p.id}`, 32, 32, (c) => {
      rect(c, '#3f8a35', 15, 12, 2, 18);
      rect(c, '#58b857', 10, 22, 5, 3);
      rect(c, '#58b857', 17, 19, 5, 3);
      const ring = (n: number, radius: number, size: number, cx = 16, cy = 9) => {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          rect(c, p.petal, cx + Math.round(Math.cos(a) * radius) - size / 2, cy + Math.round(Math.sin(a) * radius) - size / 2, size, size);
        }
      };
      switch (p.pattern) {
        case 'fluff': // 민들레: 촘촘하고 가느다란 꽃잎 다수
          ring(10, 7, 3);
          rect(c, p.center, 14, 7, 4, 4);
          break;
        case 'droop': // 제비꽃: 작고 아래로 기운 비대칭 꽃잎
          rect(c, p.petal, 10, 9, 5, 5);
          rect(c, p.petal, 13, 5, 5, 6);
          rect(c, p.petal, 11, 13, 4, 3);
          rect(c, p.center, 13, 10, 3, 3);
          break;
        case 'leaf3': // 클로버: 꽃이 아니라 세 잎
          rect(c, p.petal, 9, 7, 8, 8);
          rect(c, p.petal, 17, 7, 8, 8);
          rect(c, p.petal, 13, 2, 8, 8);
          rect(c, p.center, 14, 9, 1, 5);
          rect(c, p.center, 10, 9, 5, 1);
          rect(c, p.center, 18, 9, 5, 1);
          break;
        case 'disc': // 해바라기: 큰 원반 + 두꺼운 꽃잎
          ring(8, 8, 4);
          rect(c, p.center, 12, 2, 8, 8);
          break;
        case 'rays8': // 코스모스: 얇고 끝이 뾰족한 8장
          ring(8, 6, 2);
          rect(c, p.center, 15, 7, 3, 3);
          break;
        case 'rays12': // 데이지: 더 가늘고 많은 꽃잎
          ring(12, 7, 2);
          rect(c, p.center, 14, 6, 5, 5);
          break;
        case 'umbrella': // 수국: 작은 꽃송이 뭉치
          for (const [dx, dy] of [[12, 8], [18, 8], [15, 4], [11, 12], [19, 12], [15, 10]] as const) rect(c, p.petal, dx, dy, 3, 3);
          rect(c, p.center, 14, 8, 2, 2);
          break;
        case 'spike': // 라벤더: 줄기 위로 작은 점들이 촘촘히
          for (let i = 0; i < 6; i++) rect(c, p.petal, 13 + (i % 2) * 3, 2 + i * 2, 3, 2);
          break;
        case 'cup': // 튤립: 닫힌 컵 모양 하나
          rect(c, p.petal, 11, 4, 10, 10);
          rect(c, p.petal, 13, 2, 6, 4);
          rect(c, p.center, 14, 10, 4, 3);
          break;
        case 'trumpet': // 무궁화: 넓은 꽃잎 5장 + 길게 뻗은 수술
          ring(5, 6, 6);
          rect(c, p.center, 15, 6, 2, 10);
          break;
        case 'bell-small': // 은방울꽃: 작은 종 여러 개가 아래로
          rect(c, p.petal, 11, 10, 5, 6);
          rect(c, p.petal, 18, 8, 5, 6);
          rect(c, p.petal, 14, 4, 5, 6);
          rect(c, p.center, 13, 14, 2, 2);
          rect(c, p.center, 20, 12, 2, 2);
          break;
        case 'bell-trumpet': // 수선화: 종 + 가운데 큰 나팔
          rect(c, p.petal, 10, 8, 12, 9);
          rect(c, p.center, 13, 9, 6, 7);
          break;
      }
    });
  }
}

function bakeTerrain(scene: Phaser.Scene, terrain: Terrain[][]): void {
  make(scene, 'terrain', COLS * TILE, ROWS * TILE, (c) => {
    const r = rng(42);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * TILE;
        const y = row * TILE;
        const t = terrain[row][col];
        if (t === 'water') {
          rect(c, '#3a9ad9', x, y, TILE, TILE);
          for (let i = 0; i < 4; i++) rect(c, '#7fcdf5', x + Math.floor(r() * 24), y + Math.floor(r() * 30), 6 + Math.floor(r() * 5), 2);
          continue;
        }
        if (t === 'bridge') {
          rect(c, '#a9743c', x, y, TILE, TILE);
          for (let i = 0; i < 4; i++) rect(c, '#8a6238', x, y + i * 8, TILE, 2);
          continue;
        }
        if (t === 'path') {
          rect(c, '#d9cfa8', x, y, TILE, TILE);
          for (let i = 0; i < 5; i++) rect(c, '#c4b88b', x + Math.floor(r() * 28), y + Math.floor(r() * 28), 4, 3);
          continue;
        }
        rect(c, r() < 0.5 ? '#8fbf4a' : '#86b844', x, y, TILE, TILE);
        for (let i = 0; i < 3; i++) rect(c, '#6fa23a', x + Math.floor(r() * 28), y + Math.floor(r() * 28), 2, 4);
      }
    }
  });
}
