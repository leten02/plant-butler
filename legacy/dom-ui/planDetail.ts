import { copy } from '../core/copy';
import { PLACE_OPTIONS, WHEN_OPTIONS } from '../core/rules';
import { btn, el } from './dom';
import { activityImg } from './icons';

export interface PlanDetailOptions {
  /** 활동 아이콘(없으면 직접 적은 일 = 연필) */
  activityId?: string;
  title: string;
  minutes: number;
  when: string;
  where: string;
  onChange: (v: { when: string; where: string }) => void;
  /** [더 작게]·[다른 활동] 같은 보조 버튼 */
  extra: HTMLElement[];
  onConfirm: () => void;
}

function select(label: string, options: readonly string[], value: string, onPick: (v: string) => void): HTMLElement {
  const box = el('div', 'fact');
  const sel = el('select', 'chip-select');
  sel.setAttribute('aria-label', label);
  const all = options.includes(value) ? options : [...options, value];
  for (const o of all) sel.append(Object.assign(el('option', '', o), { value: o, selected: o === value }));
  sel.addEventListener('change', () => onPick(sel.value));
  box.append(el('small', '', label), sel);
  return box;
}

/** 미션·일상 연결이 함께 쓰는 "언제 / 어디서 / 얼마나" 계획 화면. */
export function planDetail(o: PlanDetailOptions): HTMLElement[] {
  let { when, where } = o;
  const body = el('div', 'detail');
  const side = el('div', 'detail-side');
  const facts = el('div', 'facts');
  const howBox = el('div', 'fact');
  howBox.append(el('small', '', copy.panel.how), el('strong', '', o.minutes > 0 ? copy.panel.minutesFrom(o.minutes) : '내 속도로'));
  facts.append(
    select(copy.panel.when, WHEN_OPTIONS, when, (v) => { when = v; o.onChange({ when, where }); }),
    select(copy.panel.where, PLACE_OPTIONS, where, (v) => { where = v; o.onChange({ when, where }); }),
    howBox,
  );
  const alt = el('div', 'detail-alt');
  alt.append(...o.extra);
  side.append(el('h3', '', o.title), facts, alt);
  const art = el('div', 'detail-art');
  art.append(activityImg(o.activityId, 'detail-img'));
  body.append(art, side);
  return [body, btn('btn btn-primary', copy.panel.confirm, o.onConfirm)];
}
