// 새싹이 포즈. 이미지는 public/assets/sprout/{포즈}.png (64×64, 발이 아래에서 2px 위).
// 원본 시트는 art/source/sprout-sheet.webp.

export type SproutPose = 'idle' | 'walk1' | 'walk2' | 'joy' | 'rest';
export const SPROUT_POSES: SproutPose[] = ['idle', 'walk1', 'walk2', 'joy', 'rest'];
/** 스프라이트 안에서 발이 닿는 y 비율(스프라이트 원점) */
export const SPROUT_ORIGIN_Y = 62 / 64;

export function sproutUrl(pose: SproutPose): string {
  return `${import.meta.env.BASE_URL}assets/sprout/${pose}.png`;
}
