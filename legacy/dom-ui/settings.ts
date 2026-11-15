import { getDayOffset, setDayOffset, todayKey } from '../core/clock';
import { copy } from '../core/copy';
import { fillSample } from '../core/demo';
import { directPlanRatio } from '../core/stats';
import { store } from '../core/store';
import { nextDecorSlot, nextPlantSlot } from '../scene/map';
import { btn, el } from './dom';
import { closeModal, openModal, replaceModalContent } from './modal';
import { afterDayChange } from './flow';
import { iconBtn } from './icons';

function toggle(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const row = el('label', 'switch');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = checked;
  box.addEventListener('change', () => onChange(box.checked));
  row.append(box, el('span', '', label));
  return row;
}

/** 저장은 끝났으니 장면을 처음부터 다시 그리도록 새로고침한다. */
const reload = () => window.location.reload();

export function openSettings(): void {
  let confirmReset = false;
  const show = () => replaceModalContent(render());

  const render = (): HTMLElement => {
    const { settings, logs } = store.state;
    const box = el('section', 'panel settings');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.settings.title);

    const bar = el('div', 'panel-head');
    const close = iconBtn('close', copy.panel.close, closeModal);
    bar.append(el('span', 'icon-spacer'), el('h2', 'panel-title', copy.settings.title), close);
    box.append(bar);

    const body = el('div', 'settings-body');
    body.append(
      toggle(copy.settings.sound, !settings.sound, (off) => store.update((d) => { d.settings.sound = !off; })),
      toggle(copy.settings.demo, settings.demo, (on) => {
        setDayOffset(0);
        store.update((d) => {
          d.settings.demo = on;
          d.settings.dayOffset = 0;
        });
        show();
      }),
    );

    if (settings.demo) {
      const demo = el('div', 'demo-box');
      demo.append(el('p', 'panel-note', copy.settings.today(todayKey())));
      const row = el('div', 'btn-pair');
      row.append(
        btn('btn btn-secondary', copy.settings.nextDay, () => {
          const offset = getDayOffset() + 1;
          setDayOffset(offset);
          store.update((d) => { d.settings.dayOffset = offset; });
          closeModal();
          afterDayChange();
        }),
        btn('btn btn-secondary', copy.settings.fill, () => {
          store.update((d) => fillSample(d, todayKey(), { decor: nextDecorSlot, plant: nextPlantSlot }));
          reload();
        }),
      );
      const n = logs.filter((l) => l.source === 'design').length;
      const pct = logs.length ? Math.round(directPlanRatio(logs) * 100) : 0;
      demo.append(row, el('p', 'debug-line', `${copy.settings.debug} · ${copy.settings.directRatio(pct, n, logs.length)}`));
      body.append(demo);
    }

    if (confirmReset) {
      const ask = el('div', 'demo-box');
      const pair = el('div', 'btn-pair');
      pair.append(
        btn('btn btn-primary', copy.settings.resetYes, () => {
          setDayOffset(0);
          store.reset();
          reload();
        }),
        btn('btn btn-secondary', copy.settings.resetNo, () => { confirmReset = false; show(); }),
      );
      ask.append(el('p', 'panel-note', copy.settings.resetAsk), pair);
      body.append(ask);
    } else {
      body.append(btn('btn btn-secondary', copy.settings.reset, () => { confirmReset = true; show(); }));
    }
    box.append(body);
    return box;
  };

  openModal(render);
}
