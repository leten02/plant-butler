import { activityById } from '../core/activities';
import { todayKey } from '../core/clock';
import { copy } from '../core/copy';
import type { ReflectChip } from '../core/types';
import { store } from '../core/store';
import { btn, el } from './dom';
import { closeModal, openModal } from './modal';
import { activityImg } from './icons';

const CHIPS: { id: ReflectChip; label: string }[] = [
  { id: 'achieved', label: copy.reflect.achieved },
  { id: 'easier', label: copy.reflect.easier },
  { id: 'again', label: copy.reflect.again },
];

/** [했어요] 다음 단계. 칩은 고르지 않고 건너뛰어도 된다. */
export function openReflect(onSave: (chips: ReflectChip[]) => void): void {
  const plan = store.state.days[todayKey()]?.plan;
  if (!plan) return;
  const activity = activityById(plan.activityId);
  const picked = new Set<ReflectChip>();

  const finish = (chips: ReflectChip[]) => {
    closeModal();
    onSave(chips);
  };

  openModal(() => {
    const box = el('section', 'panel reflect');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.reflect.heading);
    box.append(el('h2', 'panel-title', copy.reflect.heading));
    const line = el('p', 'reflect-activity');
    line.append(activityImg(plan.activityId, 'act-icon'), el('span', '', activity?.name ?? plan.text ?? ''));
    box.append(line);
    box.append(el('p', 'panel-note', copy.reflect.title));
    const chips = el('div', 'chips');
    for (const c of CHIPS) {
      const b = btn('chip', c.label, () => {
        if (picked.has(c.id)) picked.delete(c.id);
        else picked.add(c.id);
        b.setAttribute('aria-pressed', String(picked.has(c.id)));
        b.classList.toggle('chip-on', picked.has(c.id));
      });
      b.setAttribute('aria-pressed', 'false');
      chips.append(b);
    }
    const actions = el('div', 'btn-pair');
    actions.append(btn('btn btn-primary', copy.reflect.save, () => finish([...picked])), btn('btn btn-secondary', copy.reflect.skip, () => finish([])));
    box.append(chips, actions);
    return box;
  }, false);
}
