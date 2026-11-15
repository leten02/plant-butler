import { events } from '../core/events';
import { el } from './dom';

let layer: HTMLElement | null = null;
let onKey: ((e: KeyboardEvent) => void) | null = null;
let closeHook: (() => void) | null = null;

export function closeModal(): void {
  if (!layer) return;
  layer.remove();
  layer = null;
  if (onKey) window.removeEventListener('keydown', onKey);
  onKey = null;
  events.emit('ui-lock', { locked: false });
  const hook = closeHook;
  closeHook = null;
  hook?.();
}

/** build가 돌려준 요소를 화면 가운데 모달로 띄운다. 한 번에 하나만 열린다. */
export function openModal(build: () => HTMLElement, dismissable = true, onClose?: () => void): HTMLElement {
  closeModal();
  closeHook = onClose ?? null;
  const root = document.getElementById('ui')!;
  layer = el('div', 'modal-layer interactive');
  layer.append(build());
  if (dismissable) {
    layer.addEventListener('pointerdown', (e) => {
      if (e.target === layer) closeModal();
    });
  }
  const current = layer;
  onKey = (e) => {
    if (e.key === 'Escape' && dismissable) closeModal();
    if (e.key !== 'Tab') return;
    // 모달 밖(정원 뒤쪽 버튼)으로 포커스가 새지 않게 안에서만 돌린다.
    const items = [...current.querySelectorAll<HTMLElement>('button:not([disabled]), select, input')];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  window.addEventListener('keydown', onKey);
  root.append(layer);
  events.emit('ui-lock', { locked: true });
  layer.querySelector<HTMLElement>('button, select')?.focus();
  return layer;
}

/** 이미 열린 모달의 내용만 갈아끼운다(포커스·잠금은 유지). */
export function replaceModalContent(content: HTMLElement): void {
  if (!layer) return;
  layer.replaceChildren(content);
  layer.querySelector<HTMLElement>('button, select')?.focus();
}

export function isModalOpen(): boolean {
  return layer !== null;
}
