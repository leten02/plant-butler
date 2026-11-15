import { activityById } from '../core/activities';
import { plantById } from '../core/plants';
import { todayKey } from '../core/clock';
import { copy } from '../core/copy';
import { groupByDate, weekKindsCount } from '../core/stats';
import { store } from '../core/store';
import type { LogEntry } from '../core/types';
import { btn, el } from './dom';
import { closeModal, openModal, replaceModalContent } from './modal';
import { activityImg, iconBtn, iconImg, plantImg, wrap } from './icons';

function formatDate(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일`;
}

function logRow(l: LogEntry): HTMLElement {
  const a = activityById(l.activityId);
  const row = el('li', 'rec-item');
  const info = el('div', 'mission-info');
  const place = [l.plan.when, l.plan.where || l.plan.criterion].filter(Boolean).join(' · ');
  info.append(el('strong', '', a?.name ?? l.text ?? ''), el('small', '', place));
  if (l.chips.length) info.append(el('small', 'rec-chips', l.chips.map((c) => copy.records.chip[c]).join(' · ')));
  row.append(wrap('mission-icon', activityImg(l.activityId)), info);
  return row;
}

type RecordsTab = 'log' | 'book';

function bookBody(box: HTMLElement): void {
  // 도감은 종류별로 한 장. 창고에 넣어 둔 식물도 만난 걸로 센다. 처음 만난 날을 보여 준다.
  const first = new Map<string, string>();
  for (const p of [...store.state.garden.plants, ...store.state.garden.storage.filter((s) => s.type === 'plant')]) {
    const id = 'plantId' in p ? p.plantId : '';
    const date = 'date' in p ? p.date : '';
    if (id && (!first.has(id) || date < (first.get(id) ?? ''))) first.set(id, date);
  }
  if (first.size === 0) {
    box.append(el('p', 'panel-message', copy.book.empty));
    return;
  }
  box.append(el('p', 'week-summary', copy.book.count(first.size)));
  const grid = el('ul', 'book-grid');
  for (const [id, date] of first) {
    const plant = plantById(id);
    const card = el('li', 'book-card');
    card.append(wrap('book-icon', plant ? plantImg(plant.id) : iconImg('sprout')), el('strong', '', plant?.name ?? ''), el('small', '', formatDate(date)));
    grid.append(card);
  }
  box.append(grid);
}

function logBody(box: HTMLElement): void {
  const { logs } = store.state;
  if (logs.length === 0) {
    box.append(el('p', 'panel-message', copy.records.empty));
    return;
  }
  box.append(el('p', 'week-summary', copy.records.weekSummary(weekKindsCount(logs, todayKey()))));
  const scroll = el('div', 'records-scroll');
  for (const g of groupByDate(logs)) {
    scroll.append(el('h3', 'rec-date', formatDate(g.date)));
    const list = el('ul', 'mission-list');
    g.logs.forEach((l) => list.append(logRow(l)));
    scroll.append(list);
  }
  box.append(scroll);
}

/** 기록: 날짜별로 해낸 활동만. 도감: 정원에 심어진 식물만. 빈 칸·빈 날은 보이지 않는다. */
export function openRecords(initial: RecordsTab = 'log'): void {
  let tab = initial;
  const render = (): HTMLElement => {
    const box = el('section', 'panel records');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.records.title);
    const bar = el('div', 'panel-head');
    const close = iconBtn('close', copy.panel.close, closeModal);
    const tabs = el('div', 'tabs');
    tabs.setAttribute('role', 'tablist');
    for (const [id, label] of [['log', copy.book.logTab], ['book', copy.book.tab]] as const) {
      const t = btn('tab', label, () => { tab = id; replaceModalContent(render()); });
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', String(tab === id));
      tabs.append(t);
    }
    bar.append(el('span', 'icon-spacer'), tabs, close);
    box.append(bar);
    if (tab === 'log') logBody(box);
    else bookBody(box);
    return box;
  };
  openModal(render);
}
