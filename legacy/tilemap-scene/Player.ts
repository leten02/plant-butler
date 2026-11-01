import Phaser from 'phaser';
import { MAP_H, MAP_W } from './map';
import { SPROUT_ORIGIN_Y, type SproutPose } from './sprites';

const SPEED = 96; // px/초
const FOOT_HALF_W = 7;
const FOOT_H = 6;

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  private pose: SproutPose | 'walk' = 'idle';

  /** x, y는 발 위치 */
  constructor(private scene: Phaser.Scene, x: number, y: number, private isBlocked: (px: number, py: number) => boolean) {
    this.sprite = scene.add.sprite(x, y, 'sprout_idle').setOrigin(0.5, SPROUT_ORIGIN_Y);
    if (!scene.anims.exists('sprout-walk')) {
      scene.anims.create({
        key: 'sprout-walk',
        frames: [{ key: 'sprout_walk1' }, { key: 'sprout_walk2' }],
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  get currentPose(): SproutPose | 'walk' { return this.pose; }

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  setPose(pose: SproutPose): void {
    this.pose = pose;
    this.sprite.anims.stop();
    this.sprite.setTexture(`sprout_${pose}`);
  }

  /** 방향 벡터(-1..1)로 이동. 축마다 따로 충돌을 검사해 벽을 따라 미끄러진다. */
  move(vx: number, vy: number, dtMs: number): void {
    const moving = vx !== 0 || vy !== 0;
    if (moving && (this.pose === 'rest' || this.pose === 'joy')) this.pose = 'idle';
    if (moving) {
      const step = (SPEED * dtMs) / 1000;
      const nx = Phaser.Math.Clamp(this.x + vx * step, FOOT_HALF_W, MAP_W - FOOT_HALF_W);
      if (!this.collides(nx, this.y)) this.sprite.x = nx;
      const ny = Phaser.Math.Clamp(this.y + vy * step, FOOT_H, MAP_H);
      if (!this.collides(this.x, ny)) this.sprite.y = ny;
      if (vx !== 0) this.sprite.setFlipX(vx < 0);
      if (this.pose !== 'walk') {
        this.pose = 'walk';
        this.sprite.play('sprout-walk');
      }
    } else if (this.pose === 'walk') {
      this.setPose('idle');
    }
    this.sprite.setDepth(this.sprite.y);
  }

  private collides(x: number, y: number): boolean {
    return (
      this.isBlocked(x - FOOT_HALF_W, y - FOOT_H) || this.isBlocked(x + FOOT_HALF_W, y - FOOT_H) ||
      this.isBlocked(x - FOOT_HALF_W, y - 1) || this.isBlocked(x + FOOT_HALF_W, y - 1)
    );
  }
}
