import { activityById } from '../core/activities';
import { todayKey } from '../core/clock';
import { copy } from '../core/copy';
import {
  chooseRest, defaultPlanInfo, designPlan, isResting, limitReached, makeSmaller, pastItems, setPlan, suggest, swapCandidate,
  tabHints, undoRest, WHEN_OPTIONS, type PastItem,
} from '../core/rules';
import { store } from '../core/store';
import type { Activity } from '../core/types';
import { btn, el } from './dom';
import { closeModal, openModal, replaceModalContent } from './modal';
import { planDetail } from './planDetail';
import { activityImg, iconBtn, wrap } from './icons';

export type PanelTab = 'mission' | 'daily' | 'design';
export interface PanelOptions {
  tab?: PanelTab;
  /** 이미 세운 계획의 상세 화면으로 바로 */
  detail?: boolean;
}

export function openActivityPanel(opts: PanelOptions = {}): void {
  const date = todayKey();
  const plan = store.state.days[date]?.plan;

  let tab: PanelTab = opts.tab ?? 'mission';
  // 미션 탭
  let items: Activity[] = suggest(store.state, date);
  let draft: Activity | undefined;
  let mWhen: string = WHEN_OPTIONS[0];
  let mWhere = '';
  // 일상 연결 탭
  let pick: PastItem | undefined;
  let dWhen: string = WHEN_OPTIONS[0];
  let dWhere = '';
  // 하루 설계 탭
  let wish = '';
  let gWhen: string = WHEN_OPTIONS[0];
  let criterion = '';

  if (plan?.source === 'design') {
    wish = plan.text ?? '';
    gWhen = plan.info.when;
    criterion = plan.info.criterion ?? '';
    if (opts.detail) tab = 'design';
  } else if (plan && opts.detail) {
    if (plan.source === 'daily') {
      pick = pastItems(store.state).find((p) => p.key === (plan.activityId ?? `text:${plan.text}`));
      dWhen = plan.info.when;
      dWhere = plan.info.where;
      if (pick) tab = 'daily';
    } else if (activityById(plan.activityId)) {
      draft = activityById(plan.activityId);
      mWhen = plan.info.when;
      mWhere = plan.info.where;
      tab = 'mission';
    }
  }

  const show = () => replaceModalContent(render());

  const restButton = () =>
    btn('btn btn-secondary', copy.panel.rest, () => {
      store.update((d) => chooseRest(d, date));
      closeModal();
    });

  const confirmPlan = (p: Parameters<typeof setPlan>[2]) => {
    store.update((d) => setPlan(d, date, p));
    closeModal();
  };

  // ---------- 머리말: [뒤로] 탭 3개 [닫기] ----------
  const header = (withTabs: boolean, back?: () => void): HTMLElement => {
    const bar = el('div', 'panel-head');
    const left = back ? iconBtn('back', copy.panel.back, back) : el('span', 'icon-spacer');
    const close = iconBtn('close', copy.panel.close, closeModal);
    bar.append(left);
    if (withTabs) {
      const hints = tabHints(store.state);
      const tabs = el('div', 'tabs');
      tabs.setAttribute('role', 'tablist');
      const defs: [PanelTab, string, boolean][] = [
        ['mission', copy.tabs.mission, false],
        ['daily', copy.tabs.daily, hints.daily],
        ['design', copy.tabs.design, hints.design],
      ];
      for (const [id, label, hint] of defs) {
        const t = btn('tab', label, () => { tab = id; show(); });
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', String(tab === id));
        if (hint && tab !== id) t.append(el('em', 'hint', copy.tabs.hint));
        tabs.append(t);
      }
      bar.append(tabs);
    } else {
      bar.append(el('h2', 'panel-title', copy.panel.title));
    }
    bar.append(close);
    return bar;
  };

  // ---------- 미션 ----------
  const missionList = (box: HTMLElement) => {
    const list = el('ul', 'mission-list');
    items.forEach((a, i) => {
      const row = el('li', 'mission-row');
      const info = el('div', 'mission-info');
      info.append(el('strong', '', a.name), el('small', '', copy.panel.minutes(a.minutes)));
      const actions = el('div', 'mission-actions');
      const smaller = makeSmaller(a);
      if (smaller) actions.append(btn('btn-chip', copy.panel.smaller(smaller.minutes), () => { items[i] = smaller; show(); }));
      actions.append(
        btn('btn-chip', copy.panel.swap, () => {
          const next = swapCandidate(store.state, date, items);
          if (next) items[i] = next;
          show();
        }),
        btn('btn-chip btn-chip-primary', copy.panel.pick, () => {
          draft = a;
          mWhen = WHEN_OPTIONS[0];
          mWhere = defaultPlanInfo(a).where;
          show();
        }),
      );
      row.append(wrap('mission-icon', activityImg(a.id)), info, actions);
      list.append(row);
    });
    box.append(list, restButton());
  };

  const missionDetail = (box: HTMLElement, a: Activity) => {
    const small = makeSmaller(a);
    const extra: HTMLElement[] = [];
    if (small) extra.push(btn('btn-chip', copy.panel.smaller(small.minutes), () => { draft = small; mWhere = defaultPlanInfo(small).where; show(); }));
    extra.push(btn('btn-chip', copy.panel.another, () => { draft = undefined; show(); }));
    box.append(
      ...planDetail({
        activityId: a.id, title: a.name, minutes: a.minutes, when: mWhen, where: mWhere || defaultPlanInfo(a).where, extra,
        onChange: (v) => { mWhen = v.when; mWhere = v.where; },
        onConfirm: () => confirmPlan({ activityId: a.id, info: { ...defaultPlanInfo(a, mWhen), where: mWhere || defaultPlanInfo(a).where }, source: 'mission' }),
      }),
      restButton(),
    );
  };

  // ---------- 일상 연결 ----------
  const dailyBody = (box: HTMLElement) => {
    if (pick) {
      const p = pick;
      box.append(
        ...planDetail({
          activityId: p.activityId, title: p.label, minutes: p.minutes, when: dWhen, where: dWhere || p.where || '집 근처', extra: [],
          onChange: (v) => { dWhen = v.when; dWhere = v.where; },
          onConfirm: () =>
            confirmPlan({
              activityId: p.activityId, text: p.text, source: 'daily',
              info: { when: dWhen, where: dWhere || p.where || '집 근처', minutes: p.minutes, ...(p.criterion ? { criterion: p.criterion } : {}) },
            }),
        }),
        restButton(),
      );
      return;
    }
    const past = pastItems(store.state);
    if (past.length === 0) {
      box.append(el('p', 'panel-message', copy.daily.empty));
      return;
    }
    box.append(el('p', 'panel-note', copy.daily.intro));
    const list = el('ul', 'mission-list scrolling');
    for (const p of past) {
      const row = el('li', 'mission-row');
      const info = el('div', 'mission-info');
      info.append(el('strong', '', p.label), el('small', '', p.where));
      row.append(
        wrap('mission-icon', activityImg(p.activityId)), info,
        btn('btn-chip btn-chip-primary', copy.daily.pick, () => { pick = p; dWhen = WHEN_OPTIONS[0]; dWhere = p.where; show(); }),
      );
      list.append(row);
    }
    box.append(list, restButton());
  };

  // ---------- 하루 설계 ----------
  const designBody = (box: HTMLElement) => {
    const wishInput = el('input', 'text-input');
    wishInput.type = 'text';
    wishInput.maxLength = 40;
    wishInput.value = wish;
    wishInput.placeholder = copy.design.wishPlaceholder;
    wishInput.setAttribute('aria-label', copy.design.wish);

    const whenSel = el('select', 'text-input');
    whenSel.setAttribute('aria-label', copy.design.when);
    for (const w of WHEN_OPTIONS) whenSel.append(Object.assign(el('option', '', w), { value: w, selected: w === gWhen }));
    whenSel.addEventListener('change', () => { gWhen = whenSel.value; });

    const critInput = el('input', 'text-input');
    critInput.type = 'text';
    critInput.maxLength = 40;
    critInput.value = criterion;
    critInput.placeholder = copy.design.criterionPlaceholder;
    critInput.setAttribute('aria-label', copy.design.criterion);
    critInput.addEventListener('input', () => { criterion = critInput.value; });

    const field = (label: string, input: HTMLElement, cls = '') => {
      const f = el('label', `field ${cls}`);
      f.append(el('span', '', label), input);
      return f;
    };
    const row = el('div', 'field-row');
    row.append(field(copy.design.when, whenSel, 'narrow'), field(copy.design.criterion, critInput));

    const save = btn('btn btn-primary', copy.design.save, () => {
      const p = designPlan(wish, gWhen, criterion);
      if (p) confirmPlan(p);
    });
    save.disabled = wish.trim() === '';
    wishInput.addEventListener('input', () => { wish = wishInput.value; save.disabled = wish.trim() === ''; });

    const again = btn('btn btn-secondary', copy.design.again, () => { tab = 'mission'; draft = undefined; show(); });
    const buttons = el('div', 'btn-pair');
    buttons.append(save, again);
    box.append(field(copy.design.wish, wishInput), row, el('p', 'panel-note', copy.design.note), buttons);
  };

  // ---------- 전체 ----------
  const render = (): HTMLElement => {
    const box = el('section', 'panel activity-panel');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.panel.title);
    const state = store.state;

    if (isResting(state, date)) {
      box.append(
        header(false), el('p', 'panel-message', copy.card.resting),
        btn('btn btn-primary', copy.card.unrest, () => {
          store.update((d) => undoRest(d, date));
          items = suggest(store.state, date);
          show();
        }),
      );
      return box;
    }
    if (limitReached(state, date)) {
      box.append(header(false), el('p', 'panel-message', copy.card.enough), el('p', 'panel-note', copy.card.enoughSub));
      return box;
    }

    let back: (() => void) | undefined;
    if (tab === 'mission' && draft) back = () => { draft = undefined; show(); };
    else if (tab === 'daily' && pick) back = () => { pick = undefined; show(); };
    box.append(header(true, back));

    if (tab === 'mission') (draft ? missionDetail(box, draft) : missionList(box));
    else if (tab === 'daily') dailyBody(box);
    else designBody(box);
    if (tab !== 'design') box.append(el('p', 'panel-note', copy.panel.footnote));
    return box;
  };

  openModal(render);
}
