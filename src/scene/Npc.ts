import Phaser from 'phaser';
import type { NpcId } from '../core/events';

const SIZE = 60; // 화면에서 보이는 크기(px)
const SPEED = 20; // px/초
const LABEL_DEPTH = 8000; // 이름표는 소품에 가려지지 않게 항상 위에
const ROAM = 60; // 자기 자리에서 이만큼 안쪽만 서성인다

/** 정원에 사는 주민. 자기 자리 근처를 천천히 서성이다가, 새싹이가 가까이 오거나 대화 중이면 멈춘다. */
export class Npc {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private target: { x: number; y: number } | null = null;
  private pause = 800 + Math.random() * 2000;
  private clock = Math.random() * 1000;

  constructor(
    private scene: Phaser.Scene,
    readonly id: NpcId,
    name: string,
    private home: { x: number; y: number },
    private canStand: (x: number, y: number) => boolean,
    onTap: () => void,
  ) {
    this.sprite = scene.add.image(home.x, home.y, `npc_${id}_front`).setOrigin(0.5, 0.96).setDisplaySize(SIZE, SIZE);
    this.sprite.setInteractive({ useHandCursor: true }).on('pointerdown', onTap);
    this.label = scene.add
      .text(home.x, home.y, name, {
        fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#2b1f17',
        backgroundColor: '#fffaf0', // 반투명이면 배경 그림이 비쳐서 흐려 보인다. 꽉 찬 색으로.
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setResolution(2);
    this.place();
  }

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  private place(): void {
    this.sprite.setDepth(this.sprite.y);
    this.label.setPosition(this.sprite.x, this.sprite.y - SIZE + 2).setDepth(LABEL_DEPTH);
  }

  private pose(p: 'front' | 'side' | 'walk' | 'back'): void {
    this.sprite.setTexture(`npc_${this.id}_${p}`);
  }

  /** frozen: 창이 열려 있거나 꾸미는 중이면 가만히 있는다. */
  update(dtMs: number, player: { x: number; y: number }, frozen: boolean): void {
    this.clock += dtMs;
    const near = Math.hypot(player.x - this.x, player.y - this.y) < 80;
    if (frozen || near) {
      this.pose('front');
      this.sprite.setFlipX(false);
      return;
    }
    if (!this.target) {
      this.pause -= dtMs;
      this.pose('front');
      this.sprite.setFlipX(false);
      if (this.pause > 0) return;
      // 자기 자리 근처에서 설 수 있는 곳을 골라 천천히 걸어간다. 못 찾으면 잠시 더 쉰다.
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * (ROAM - 20);
        const t = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r * 0.6 };
        if (this.canStand(t.x, t.y)) {
          this.target = t;
          break;
        }
      }
      this.pause = 2000 + Math.random() * 3500;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (SPEED * dtMs) / 1000;
    if (dist <= step) {
      this.target = null;
    } else {
      const nx = this.x + (dx / dist) * step;
      const ny = this.y + (dy / dist) * step;
      if (this.canStand(nx, ny)) {
        this.sprite.setPosition(nx, ny);
        // 위로 걸어갈 때는 뒷모습, 그 밖에는 옆모습 두 장을 번갈아 쓴다(왼쪽은 뒤집기).
        if (dy < 0 && Math.abs(dy) > Math.abs(dx)) {
          this.pose('back');
          this.sprite.setFlipX(false);
        } else {
          this.pose(Math.floor(this.clock / 260) % 2 ? 'walk' : 'side');
          this.sprite.setFlipX(dx < 0);
        }
      } else {
        this.target = null; // 막혔으면 거기서 멈춘다
      }
    }
    this.place();
  }
}
