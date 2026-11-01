import { useState } from 'react';
import { activityById } from '../../core/activities';
import { todayKey } from '../../core/clock';
import { copy } from '../../core/copy';
import { store } from '../../core/store';
import type { ReflectChip } from '../../core/types';
import { ActivityImg } from '../icons';
import { closeModal, openModal } from '../modal';

const CHIPS: { id: ReflectChip; label: string }[] = [
  { id: 'achieved', label: copy.reflect.achieved },
  { id: 'easier', label: copy.reflect.easier },
  { id: 'again', label: copy.reflect.again },
];

function Reflect({ onSave }: { onSave: (chips: ReflectChip[]) => void }) {
  const plan = store.state.days[todayKey()]?.plan;
  const [picked, setPicked] = useState<ReflectChip[]>([]);
  if (!plan) return null;
  const activity = activityById(plan.activityId);
  const finish = (chips: ReflectChip[]) => {
    closeModal();
    onSave(chips);
  };
  const toggle = (id: ReflectChip) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <section className="panel reflect" role="dialog" aria-label={copy.reflect.heading}>
      <h2 className="panel-title">{copy.reflect.heading}</h2>
      <p className="reflect-activity">
        <ActivityImg id={plan.activityId} />
        <span>{activity?.name ?? plan.text ?? ''}</span>
      </p>
      <p className="panel-note">{copy.reflect.title}</p>
      <div className="chips">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip${picked.includes(c.id) ? ' chip-on' : ''}`}
            aria-pressed={picked.includes(c.id)}
            onClick={() => toggle(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="btn-pair">
        <button type="button" className="btn btn-primary" onClick={() => finish(picked)}>{copy.reflect.save}</button>
        <button type="button" className="btn btn-secondary" onClick={() => finish([])}>{copy.reflect.skip}</button>
      </div>
    </section>
  );
}

/** [했어요] 다음 단계. 칩은 고르지 않고 건너뛰어도 된다. */
export function openReflect(onSave: (chips: ReflectChip[]) => void): void {
  if (!store.state.days[todayKey()]?.plan) return;
  openModal(<Reflect onSave={onSave} />, false);
}
