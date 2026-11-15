// 아이콘·삽화 이미지 만들기. 그림 파일은 tools/slice_art.py가 art/source 에서 잘라 public/assets 에 둔다.
import { el } from './dom';

const base = import.meta.env.BASE_URL;

export type UiIcon = 'records' | 'decorate' | 'settings' | 'talk' | 'packet' | 'leaf' | 'back' | 'close' | 'check' | 'clock' | 'flag' | 'sprout';

function img(src: string, className: string): HTMLImageElement {
  const i = document.createElement('img');
  i.src = src;
  i.className = className;
  i.alt = ''; // 뜻은 옆의 글자가 말해 준다
  i.draggable = false;
  i.setAttribute('aria-hidden', 'true');
  return i;
}

export const iconImg = (name: UiIcon, className = 'ui-icon') => img(`${base}assets/icons-ui/${name}.png`, className);

/** 활동 아이콘. 직접 적은 일(활동 id 없음)은 연필 아이콘. */
export const activityImg = (id?: string, className = 'act-icon') => img(`${base}assets/activities/${id ?? 'draw'}.png`, className);

export const plantImg = (id: string, className = 'plant-icon') => img(`${base}assets/plants/${id}.png`, className);

/** 정원 소품 그림. 이전 그림의 저장본(꽃·화분·등불)은 새 소품으로 바꿔 보여준다. */
const LEGACY_PROP: Record<string, string> = { flower: 'flowerpot', pot: 'flowerpot', lamp: 'table' };
export const propImg = (kind: string, className = 'prop-icon') => img(`${base}assets/garden/props/${LEGACY_PROP[kind] ?? kind}.png`, className);

export const sproutImg = (className = 'sprout-icon') => img(`${base}assets/garden/sprout/idle.png`, className);

/** 머리말의 뒤로·닫기처럼 아이콘만 있는 버튼 */
export function iconBtn(name: UiIcon, label: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', 'icon-btn');
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.append(iconImg(name));
  b.addEventListener('click', onClick);
  return b;
}

/** 이미지 하나를 span 안에 담아 CSS 크기 규칙을 받게 한다. */
export function wrap(className: string, child: HTMLElement): HTMLElement {
  const s = el('span', className);
  s.append(child);
  return s;
}
