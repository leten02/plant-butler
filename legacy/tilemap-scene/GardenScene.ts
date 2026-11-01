import Phaser from 'phaser';
import { todayKey } from '../core/clock';
import { events } from '../core/events';
import { isResting, storeDecor, storePlant, takeFromStorage } from '../core/rules';
import { store } from '../core/store';
import type { DecorItem, PlantedItem, StoredThing } from '../core/types';
import { generateAssets } from './assets';
import { buildMap, COLS, isDecorTile, isPlantTile, MAP_H, MAP_W, ROWS, TILE } from './map';
import { Player } from './Player';
import { SPROUT_POSES, sproutUrl } from './sprites';

const DECOR_ZOOM = 0.55;
const PLANT_DEPTH = 5000;
const DRAG_DEPTH = 9000;
/** 이 거리 안에서 끝나면 "끌지 않고 짚기만 했다" = 창고로 치운다. */
const TAP_THRESHOLD = TILE * 0.3;

function decorTexture(item: Pick<DecorItem, 'kind' | 'variant'>): string {
  switch (item.kind) {
    case 'pot': return 'prop_pot';
    case 'lamp': return 'prop_lamp';
    case 'bench': return 'decor_bench';
    default: return `decor_flower${item.variant % 4}`;
  }
}

export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private keys!: { cursors: Phaser.Types.Input.Keyboard.CursorKeys; wasd: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key> };
  private stick = { x: 0, y: 0 };
  private locked = false;

  private decorSprites = new Map<string, Phaser.GameObjects.Image>();
  private plantSprites = new Map<string, Phaser.GameObjects.Image>();
  private decorating = false;
  private dragId: string | null = null;
  private dragKind: 'decor' | 'plant' | null = null;
  private dragStart = { x: 0, y: 0 };
  private placing: StoredThing | null = null;
  private placingSprite?: Phaser.GameObjects.Image;
  private grid?: Phaser.GameObjects.Graphics;
  private hint?: Phaser.GameObjects.Graphics;

  constructor() {
    super('garden');
  }

  preload(): void {
    for (const pose of SPROUT_POSES) this.load.image(`sprout_${pose}`, sproutUrl(pose));
  }

  create(): void {
    const map = buildMap();
    generateAssets(this, map.terrain);

    this.add.image(0, 0, 'terrain').setOrigin(0, 0).setDepth(0);
    for (const p of map.props) {
      this.add
        .image(p.col * TILE, (p.row + p.h) * TILE, `prop_${p.kind}`)
        .setOrigin(0, 1)
        .setDepth((p.row + p.h) * TILE);
    }

    const isBlocked = (px: number, py: number) => {
      const c = Math.floor(px / TILE);
      const r = Math.floor(py / TILE);
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
      return map.blocked[r][c];
    };
    this.player = new Player(this, map.spawn.col * TILE + TILE / 2, (map.spawn.row + 1) * TILE - 2, isBlocked);

    // 가만히 있을 때 새싹이가 숨 쉬듯 살짝 움직인다(움직임 줄이기 설정이면 생략).
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.tweens.add({ targets: this.player.sprite, scaleY: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H).startFollow(this.player.sprite, true, 0.12, 0.12).setRoundPixels(true);

    const kb = this.input.keyboard!;
    this.keys = {
      cursors: kb.createCursorKeys(),
      wasd: kb.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>,
    };
    store.state.garden.items.forEach((item) => this.placeDecor(item, false));
    store.state.garden.plants.forEach((p) => this.placePlant(p, false));
    if (isResting(store.state, todayKey())) this.player.setPose('rest');

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDragStart(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onDragMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onDragEnd(p));

    const offs = [
      events.on('move-input', (v) => (this.stick = v)),
      events.on('ui-lock', ({ locked }) => this.setLocked(locked)),
      events.on('sprout-pose', ({ pose }) => this.player.setPose(pose)),
      events.on('celebrate', ({ item }) => this.celebrate(item)),
      events.on('plant-grown', ({ planted }) => this.showSpot(planted.col, planted.row, () => this.placePlant(planted, true))),
      events.on('decorate-mode', ({ on }) => (on ? this.enterDecorate() : this.exitDecorate())),
      events.on('decor-place-start', (item) => this.startPlacing(item)),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offs.forEach((off) => off()));
  }

  update(_time: number, delta: number): void {
    const { cursors, wasd } = this.keys;
    let x = (cursors.right.isDown || wasd.D.isDown ? 1 : 0) - (cursors.left.isDown || wasd.A.isDown ? 1 : 0);
    let y = (cursors.down.isDown || wasd.S.isDown ? 1 : 0) - (cursors.up.isDown || wasd.W.isDown ? 1 : 0);
    if (x === 0 && y === 0) ({ x, y } = this.stick);
    if (this.locked) x = y = 0;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.player.move(x, y, delta);

    const cam = this.cameras.main;
    events.emit('player-screen', { x: (this.player.x - cam.scrollX) * cam.zoom, y: (this.player.y - cam.scrollY) * cam.zoom });
  }

  /** 글을 쓰는 동안에는 W·A·S·D가 글자로 입력되어야 하므로 키보드 가로채기를 끈다. */
  private setLocked(locked: boolean): void {
    this.locked = locked;
    const kb = this.input.keyboard!;
    kb.enabled = !locked;
    if (locked) kb.disableGlobalCapture();
    else kb.enableGlobalCapture();
  }

  // ---------- 정원에 놓이는 것들 ----------
  private placeDecor(item: DecorItem, pop: boolean): void {
    const img = this.add
      .image(item.col * TILE + TILE / 2, (item.row + 1) * TILE, decorTexture(item))
      .setOrigin(0.5, 1)
      .setDepth((item.row + 1) * TILE);
    this.decorSprites.set(item.id, img);
    if (pop) this.pop(img);
  }

  private placePlant(p: PlantedItem, pop: boolean): void {
    const img = this.add
      .image(p.col * TILE + TILE / 2, (p.row + 1) * TILE, `plant_${p.plantId}`)
      .setOrigin(0.5, 1)
      .setDepth(PLANT_DEPTH + p.row);
    this.plantSprites.set(p.id, img);
    if (pop) this.pop(img);
  }

  private pop(img: Phaser.GameObjects.Image): void {
    img.setScale(0);
    this.tweens.add({ targets: img, scale: 1, duration: 450, ease: 'Back.easeOut' });
  }

  /** 카메라가 그 칸으로 가서 무언가 일어나는 걸 보여주고, 다시 새싹이를 따라간다. */
  private showSpot(col: number, row: number, act: () => void): void {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(col * TILE + TILE / 2, row * TILE, 700, 'Sine.easeInOut');
    this.time.delayedCall(750, act);
    this.time.delayedCall(2100, () => {
      if (!this.decorating) cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    });
  }

  private celebrate(item: DecorItem | null): void {
    this.player.setPose('joy');
    this.tweens.add({ targets: this.player.sprite, y: this.player.y - 6, duration: 180, yoyo: true, repeat: 2 });
    this.time.delayedCall(1100, () => {
      if (this.player.currentPose === 'joy') this.player.setPose('idle');
    });
    if (item) this.time.delayedCall(900, () => this.showSpot(item.col, item.row, () => this.placeDecor(item, true)));
  }

  // ---------- 꾸미기: 정원 전체를 보여주고 소품을 끌어 칸에 맞춰 놓는다 ----------
  private enterDecorate(): void {
    this.decorating = true;
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.removeBounds();
    cam.setZoom(DECOR_ZOOM);
    cam.centerOn(MAP_W / 2, MAP_H / 2);
    this.grid = this.add.graphics().setDepth(DRAG_DEPTH - 1);
    this.grid.lineStyle(1, 0xffffff, 0.28);
    for (let c = 0; c <= COLS; c++) this.grid.lineBetween(c * TILE, 0, c * TILE, MAP_H);
    for (let r = 0; r <= ROWS; r++) this.grid.lineBetween(0, r * TILE, MAP_W, r * TILE);
    this.hint = this.add.graphics().setDepth(DRAG_DEPTH - 1);
  }

  private exitDecorate(): void {
    this.decorating = false;
    this.dragId = null;
    this.cancelPlacing();
    this.grid?.destroy();
    this.hint?.destroy();
    const cam = this.cameras.main;
    cam.setZoom(1);
    cam.setBounds(0, 0, MAP_W, MAP_H);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
  }

  /** 창고에서 꺼낸 것(소품·식물): 포인터를 따라다니다 칸을 짚으면 심긴다. 취소해도 창고에 그대로 남는다. */
  private startPlacing(item: StoredThing): void {
    if (!this.decorating) return;
    this.cancelPlacing();
    this.placing = item;
    const texture = item.type === 'decor' ? decorTexture({ kind: item.decorKind, variant: item.variant }) : `plant_${item.plantId}`;
    const cam = this.cameras.main;
    this.placingSprite = this.add
      .image(cam.scrollX + cam.width / cam.zoom / 2, cam.scrollY + cam.height / cam.zoom / 2, texture)
      .setOrigin(0.5, 1)
      .setAlpha(0.85)
      .setDepth(DRAG_DEPTH);
  }

  private cancelPlacing(): void {
    this.placing = null;
    this.placingSprite?.destroy();
    this.placingSprite = undefined;
  }

  private commitPlacing(p: Phaser.Input.Pointer): void {
    const item = this.placing;
    if (!item) return;
    const { col, row } = this.tileAt(p);
    const ok = item.type === 'decor' ? this.canPlace(col, row, '') : this.canPlacePlant(col, row, '');
    if (!ok) return;
    let placed: DecorItem | PlantedItem | null = null;
    store.update((d) => {
      placed = takeFromStorage(d, item.id, { col, row });
    });
    this.cancelPlacing();
    this.hint?.clear();
    if (placed) {
      if (item.type === 'decor') this.placeDecor(placed as DecorItem, true);
      else this.placePlant(placed as PlantedItem, true);
      events.emit('decor-changed', { action: 'placed' });
    }
  }

  private tileAt(p: Phaser.Input.Pointer): { col: number; row: number } {
    return { col: Math.floor(p.worldX / TILE), row: Math.floor(p.worldY / TILE) };
  }

  /** 소품은 막히지 않은 풀밭 칸 어디든. */
  private canPlace(col: number, row: number, exceptId: string): boolean {
    const { items, plants } = store.state.garden;
    return (
      isDecorTile(col, row) &&
      !items.some((i) => i.id !== exceptId && i.col === col && i.row === row) &&
      !plants.some((p) => p.col === col && p.row === row)
    );
  }

  /** 식물은 화단 칸에만. */
  private canPlacePlant(col: number, row: number, exceptId: string): boolean {
    const { items, plants } = store.state.garden;
    return (
      isPlantTile(col, row) &&
      !items.some((i) => i.col === col && i.row === row) &&
      !plants.some((p) => p.id !== exceptId && p.col === col && p.row === row)
    );
  }

  private onDragStart(p: Phaser.Input.Pointer): void {
    if (!this.decorating) return;
    if (this.placing) {
      this.commitPlacing(p);
      return;
    }
    let best: { id: string; kind: 'decor' | 'plant'; d: number } | null = null;
    for (const item of store.state.garden.items) {
      const d = Math.hypot(p.worldX - (item.col * TILE + TILE / 2), p.worldY - (item.row * TILE + TILE / 2));
      if (d <= TILE * 1.1 && (!best || d < best.d)) best = { id: item.id, kind: 'decor', d };
    }
    for (const plant of store.state.garden.plants) {
      const d = Math.hypot(p.worldX - (plant.col * TILE + TILE / 2), p.worldY - (plant.row * TILE + TILE / 2));
      if (d <= TILE * 1.1 && (!best || d < best.d)) best = { id: plant.id, kind: 'plant', d };
    }
    if (!best) return;
    this.dragId = best.id;
    this.dragKind = best.kind;
    this.dragStart = { x: p.worldX, y: p.worldY };
    const sprites = best.kind === 'decor' ? this.decorSprites : this.plantSprites;
    sprites.get(best.id)?.setDepth(DRAG_DEPTH).setAlpha(0.85);
  }

  private onDragMove(p: Phaser.Input.Pointer): void {
    if (!this.hint) return;
    if (this.placing) {
      this.placingSprite?.setPosition(p.worldX, p.worldY + TILE / 2);
      const { col, row } = this.tileAt(p);
      const ok = this.placing.type === 'decor' ? this.canPlace(col, row, '') : this.canPlacePlant(col, row, '');
      this.hint.clear();
      this.hint.fillStyle(ok ? 0x7dff7d : 0xff7d7d, 0.45);
      this.hint.fillRect(col * TILE, row * TILE, TILE, TILE);
      return;
    }
    if (!this.dragId || !this.dragKind) return;
    const sprites = this.dragKind === 'decor' ? this.decorSprites : this.plantSprites;
    sprites.get(this.dragId)?.setPosition(p.worldX, p.worldY + TILE / 2);
    const { col, row } = this.tileAt(p);
    const ok = this.dragKind === 'decor' ? this.canPlace(col, row, this.dragId) : this.canPlacePlant(col, row, this.dragId);
    this.hint.clear();
    this.hint.fillStyle(ok ? 0x7dff7d : 0xff7d7d, 0.45);
    this.hint.fillRect(col * TILE, row * TILE, TILE, TILE);
  }

  /** 끌지 않고 짚기만 했으면 창고로 치우기, 옮겼으면 그 칸에(안 되면 원래 자리에) 놓기. */
  private onDragEnd(p: Phaser.Input.Pointer): void {
    const id = this.dragId;
    const kind = this.dragKind;
    if (!id || !kind) return;
    this.dragId = null;
    this.dragKind = null;
    this.hint?.clear();

    const isDecor = kind === 'decor';
    const subject = isDecor
      ? store.state.garden.items.find((i) => i.id === id)
      : store.state.garden.plants.find((p) => p.id === id);
    const sprites = isDecor ? this.decorSprites : this.plantSprites;
    const img = sprites.get(id);
    if (!subject || !img) return;

    const moved = Math.hypot(p.worldX - this.dragStart.x, p.worldY - this.dragStart.y);
    if (moved < TAP_THRESHOLD) {
      store.update((d) => (isDecor ? storeDecor(d, id) : storePlant(d, id)));
      sprites.delete(id);
      img.destroy();
      events.emit('decor-changed', { action: 'stored' });
      return;
    }

    let { col, row } = this.tileAt(p);
    const canGo = isDecor ? this.canPlace(col, row, id) : this.canPlacePlant(col, row, id);
    if (canGo) {
      store.update((d) => {
        const target = isDecor ? d.garden.items.find((i) => i.id === id) : d.garden.plants.find((pl) => pl.id === id);
        target!.col = col;
        target!.row = row;
      });
    } else {
      ({ col, row } = subject); // 놓을 수 없는 곳이면 원래 자리로
    }
    img.setAlpha(1).setDepth(isDecor ? (row + 1) * TILE : PLANT_DEPTH + row);
    this.tweens.add({ targets: img, x: col * TILE + TILE / 2, y: (row + 1) * TILE, duration: 120 });
  }
}
