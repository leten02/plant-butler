import { copy } from '../core/copy';
import { todayKey } from '../core/clock';
import { setEnergy } from '../core/rules';
import { store } from '../core/store';
import type { Energy } from '../core/types';
import { btn, el } from './dom';
import { closeModal, openModal } from './modal';

/** 하루 첫 진입 때 한 번. 지나가도 괜찮다(보통으로 친다). */
export function showCheckin(): void {
  const choose = (energy: Energy) => {
    store.update((d) => setEnergy(d, todayKey(), energy));
    closeModal();
  };
  openModal(() => {
    const box = el('section', 'panel checkin');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.checkin.title);
    const row = el('div', 'checkin-options');
    row.append(
      btn('btn btn-secondary', copy.checkin.heavy, () => choose('heavy')),
      btn('btn btn-secondary', copy.checkin.normal, () => choose('normal')),
      btn('btn btn-secondary', copy.checkin.good, () => choose('good')),
    );
    box.append(el('h2', 'panel-title', copy.checkin.title), row, btn('link-btn', copy.checkin.skip, () => choose('normal')));
    return box;
  }, false);
}
