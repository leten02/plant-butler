import { copy } from '../core/copy';
import { events } from '../core/events';
import { plantById } from '../core/plants';
import { store } from '../core/store';
import type { DecorItem, StoredThing } from '../core/types';
import { btn, el } from './dom';
import { closeModal, isModalOpen, openModal } from './modal';
import { showToast } from './toast';
import { iconBtn, plantImg, propImg, wrap } from './icons';

const KIND_ORDER: DecorItem['kind'][] = ['flowerpot', 'table', 'shelf', 'bench', 'birdbath', 'hammock', 'flower', 'pot', 'lamp'];

/** 창고 목록 정리: 소품은 종류별로, 식물은 이름순으로 뒤에 묶는다. */
function sortedStorage(storage: StoredThing[]): StoredThing[] {
  return [...storage].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'decor' ? -1 : 1;
    if (a.type === 'decor' && b.type === 'decor') return KIND_ORDER.indexOf(a.decorKind) - KIND_ORDER.indexOf(b.decorKind);
    if (a.type === 'plant' && b.type === 'plant') {
      return (plantById(a.plantId)?.name ?? '').localeCompare(plantById(b.plantId)?.name ?? '');
    }
    return 0;
  });
}

let bar: HTMLElement | null = null;
let textEl: HTMLElement | null = null;
let storageBtn: HTMLButtonElement | null = null;
let onKey: ((e: KeyboardEvent) => void) | null = null;
let offChanged: (() => void) | null = null;

function renderBarText(): HTMLElement {
  const count = store.state.garden.items.length;
  const text = el('div', 'decorate-text');
  text.append(el('strong', '', copy.decorate.title), el('span', '', count > 0 ? copy.decorate.hint : copy.decorate.none));
  if (count > 0) text.append(el('small', '', copy.decorate.count(count)));
  return text;
}

function refreshBar(): void {
  if (bar && textEl) {
    const next = renderBarText();
    bar.replaceChild(next, textEl);
    textEl = next;
  }
  if (storageBtn) storageBtn.textContent = copy.decorate.storage(store.state.garden.storage.length);
}

/** 창고 목록: 꺼내기를 누르면 모달을 닫고 씬에 "놓는 중" 상태를 넘긴다. */
function openStorageModal(): void {
  const render = (): HTMLElement => {
    const box = el('section', 'panel storage');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.decorate.storageTitle);
    const head = el('div', 'panel-head');
    head.append(el('span', 'icon-spacer'), el('h2', 'panel-title', copy.decorate.storageTitle), iconBtn('close', copy.panel.close, closeModal));
    box.append(head);
    const storage = store.state.garden.storage;
    if (storage.length === 0) {
      box.append(el('p', 'panel-message', copy.decorate.storageEmpty));
      return box;
    }
    const grid = el('ul', 'book-grid');
    for (const item of sortedStorage(storage)) {
      const icon = item.type === 'decor' ? propImg(item.decorKind) : plantImg(item.plantId);
      const label = item.type === 'decor' ? (copy.decorate.kind[item.decorKind] ?? item.decorKind) : plantById(item.plantId)?.name ?? '';
      const card = el('li', 'book-card');
      card.append(
        wrap('book-icon', icon),
        el('strong', '', label),
        btn('btn-chip btn-chip-primary', copy.decorate.takeOut, () => {
          closeModal();
          events.emit('decor-place-start', item);
          showToast([copy.decorate.placeHint]);
        }),
      );
      grid.append(card);
    }
    box.append(grid);
    return box;
  };
  openModal(render);
}

export function exitDecorate(): void {
  if (!bar) return;
  bar.remove();
  bar = null;
  textEl = null;
  storageBtn = null;
  document.getElementById('ui')!.classList.remove('decorating');
  if (onKey) window.removeEventListener('keydown', onKey);
  onKey = null;
  offChanged?.();
  offChanged = null;
  events.emit('decorate-mode', { on: false });
  events.emit('ui-lock', { locked: false });
}

/** 정원 전체가 보이고, 소품을 끌어 칸에 맞춰 놓거나(드래그) 짚어서 창고에 넣을 수 있는 모드. */
export function enterDecorate(): void {
  if (bar || isModalOpen()) return;
  const ui = document.getElementById('ui')!;
  ui.classList.add('decorating');
  bar = el('div', 'decorate-bar interactive');
  textEl = renderBarText();
  storageBtn = btn('btn btn-secondary', copy.decorate.storage(store.state.garden.storage.length), openStorageModal);
  bar.append(textEl, storageBtn, btn('btn btn-primary', copy.decorate.done, exitDecorate));
  ui.append(bar);
  offChanged = events.on('decor-changed', ({ action }) => {
    refreshBar();
    showToast([action === 'stored' ? copy.decorate.stored : copy.decorate.placed]);
  });
  onKey = (e) => {
    if (e.key === 'Escape') exitDecorate();
  };
  window.addEventListener('keydown', onKey);
  events.emit('ui-lock', { locked: true });
  events.emit('decorate-mode', { on: true });
}
