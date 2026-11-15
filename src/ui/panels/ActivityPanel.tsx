// 활동 패널: 미션 / 일상 연결 / 하루 설계 탭. 탭은 잠그지 않고, 기록이 쌓이면 "해볼까요?" 표시만 붙는다.
import { useState } from 'react';
import { activityById } from '../../core/activities';
import { todayKey } from '../../core/clock';
import { copy } from '../../core/copy';
import {
  chooseRest, defaultPlanInfo, designPlan, isResting, limitReached, makeSmaller, pastItems, setPlan, suggest, swapCandidate,
  tabHints, undoRest, WHEN_OPTIONS, type PastItem,
} from '../../core/rules';
import { store } from '../../core/store';
import type { Activity } from '../../core/types';
import { ActivityImg, IconBtn } from '../icons';
import { closeModal, openModal } from '../modal';
import { useAppState } from '../useAppState';
import { PanelHead } from './PanelHead';
import { PlanDetail } from './PlanDetail';

export type PanelTab = 'mission' | 'daily' | 'design';
export interface PanelOptions {
  tab?: PanelTab;
  /** 이미 세운 계획의 상세 화면으로 바로 */
  detail?: boolean;
}

/** 열 때 한 번: 이미 세운 계획이 있으면 그 탭과 값으로 시작한다. */
function initialState(opts: PanelOptions) {
  const date = todayKey();
  const plan = store.state.days[date]?.plan;
  const init = {
    tab: opts.tab ?? ('mission' as PanelTab),
    draft: undefined as Activity | undefined,
    mWhen: WHEN_OPTIONS[0] as string,
    mWhere: '',
    pick: undefined as PastItem | undefined,
    dWhen: WHEN_OPTIONS[0] as string,
    dWhere: '',
    wish: '',
    gWhen: WHEN_OPTIONS[0] as string,
    criterion: '',
  };
  if (plan?.source === 'design') {
    init.wish = plan.text ?? '';
    init.gWhen = plan.info.when;
    init.criterion = plan.info.criterion ?? '';
    if (opts.detail) init.tab = 'design';
  } else if (plan && opts.detail) {
    if (plan.source === 'daily') {
      init.pick = pastItems(store.state).find((p) => p.key === (plan.activityId ?? `text:${plan.text}`));
      init.dWhen = plan.info.when;
      init.dWhere = plan.info.where;
      if (init.pick) init.tab = 'daily';
    } else if (activityById(plan.activityId)) {
      init.draft = activityById(plan.activityId);
      init.mWhen = plan.info.when;
      init.mWhere = plan.info.where;
      init.tab = 'mission';
    }
  }
  return init;
}

function ActivityPanel({ opts }: { opts: PanelOptions }) {
  const state = useAppState();
  const date = todayKey();
  const init = useState(() => initialState(opts))[0];
  const [tab, setTab] = useState(init.tab);
  const [items, setItems] = useState<Activity[]>(() => suggest(store.state, date));
  const [draft, setDraft] = useState(init.draft);
  const [mWhen, setMWhen] = useState(init.mWhen);
  const [mWhere, setMWhere] = useState(init.mWhere);
  const [pick, setPick] = useState(init.pick);
  const [dWhen, setDWhen] = useState(init.dWhen);
  const [dWhere, setDWhere] = useState(init.dWhere);
  const [wish, setWish] = useState(init.wish);
  const [gWhen, setGWhen] = useState(init.gWhen);
  const [criterion, setCriterion] = useState(init.criterion);

  const confirmPlan = (p: Parameters<typeof setPlan>[2]) => {
    store.update((d) => setPlan(d, date, p));
    closeModal();
  };
  const rest = (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => {
        store.update((d) => chooseRest(d, date));
        closeModal();
      }}
    >
      {copy.panel.rest}
    </button>
  );

  // 쉬는 날·하루 상한: 탭 없이 안내만 보여준다.
  if (isResting(state, date)) {
    return (
      <section className="panel activity-panel" role="dialog" aria-label={copy.panel.title}>
        <PanelHead title={copy.panel.title} />
        <p className="panel-message">{copy.card.resting}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            store.update((d) => undoRest(d, date));
            setItems(suggest(store.state, date));
          }}
        >
          {copy.card.unrest}
        </button>
      </section>
    );
  }
  if (limitReached(state, date)) {
    return (
      <section className="panel activity-panel" role="dialog" aria-label={copy.panel.title}>
        <PanelHead title={copy.panel.title} />
        <p className="panel-message">{copy.card.enough}</p>
        <p className="panel-note">{copy.card.enoughSub}</p>
      </section>
    );
  }

  // ---------- 머리말: [뒤로] 탭 3개 [닫기] ----------
  const hints = tabHints(state);
  const back = tab === 'mission' && draft ? () => setDraft(undefined) : tab === 'daily' && pick ? () => setPick(undefined) : undefined;
  const tabDefs: [PanelTab, string, boolean][] = [
    ['mission', copy.tabs.mission, false],
    ['daily', copy.tabs.daily, hints.daily],
    ['design', copy.tabs.design, hints.design],
  ];
  const tabs = (
    <div className="tabs" role="tablist">
      {tabDefs.map(([id, label, hint]) => (
        <button key={id} type="button" className="tab" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
          {label}
          {hint && tab !== id && <em className="hint">{copy.tabs.hint}</em>}
        </button>
      ))}
    </div>
  );

  // ---------- 미션 ----------
  const mission = draft ? (
    <>
      <PlanDetail
        activityId={draft.id}
        title={draft.name}
        minutes={draft.minutes}
        when={mWhen}
        where={mWhere || defaultPlanInfo(draft).where}
        onWhen={setMWhen}
        onWhere={setMWhere}
        extra={
          <>
            {makeSmaller(draft) && (
              <button
                type="button"
                className="btn-chip"
                onClick={() => {
                  const small = makeSmaller(draft)!;
                  setDraft(small);
                  setMWhere(defaultPlanInfo(small).where);
                }}
              >
                {copy.panel.smaller(makeSmaller(draft)!.minutes)}
              </button>
            )}
            <button type="button" className="btn-chip" onClick={() => setDraft(undefined)}>{copy.panel.another}</button>
          </>
        }
        onConfirm={() =>
          confirmPlan({ activityId: draft.id, info: { ...defaultPlanInfo(draft, mWhen), where: mWhere || defaultPlanInfo(draft).where }, source: 'mission' })
        }
      />
      {rest}
    </>
  ) : (
    <>
      <ul className="mission-list">
        {items.map((a, i) => {
          const smaller = makeSmaller(a);
          const replace = (next: Activity) => setItems((cur) => cur.map((x, j) => (j === i ? next : x)));
          return (
            <li className="mission-row" key={`${a.id}-${i}`}>
              <span className="mission-icon"><ActivityImg id={a.id} /></span>
              <div className="mission-info">
                <strong>{a.name}</strong>
                <small>{copy.panel.minutes(a.minutes)}</small>
              </div>
              <div className="mission-actions">
                {smaller && <button type="button" className="btn-chip" onClick={() => replace(smaller)}>{copy.panel.smaller(smaller.minutes)}</button>}
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => {
                    const next = swapCandidate(store.state, date, items);
                    if (next) replace(next);
                  }}
                >
                  {copy.panel.swap}
                </button>
                <button
                  type="button"
                  className="btn-chip btn-chip-primary"
                  onClick={() => {
                    setDraft(a);
                    setMWhen(WHEN_OPTIONS[0]);
                    setMWhere(defaultPlanInfo(a).where);
                  }}
                >
                  {copy.panel.pick}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {rest}
    </>
  );

  // ---------- 일상 연결 ----------
  const past = pastItems(state);
  const daily = pick ? (
    <>
      <PlanDetail
        activityId={pick.activityId}
        title={pick.label}
        minutes={pick.minutes}
        when={dWhen}
        where={dWhere || pick.where || '집 근처'}
        onWhen={setDWhen}
        onWhere={setDWhere}
        onConfirm={() =>
          confirmPlan({
            activityId: pick.activityId, text: pick.text, source: 'daily',
            info: { when: dWhen, where: dWhere || pick.where || '집 근처', minutes: pick.minutes, ...(pick.criterion ? { criterion: pick.criterion } : {}) },
          })
        }
      />
      {rest}
    </>
  ) : past.length === 0 ? (
    <p className="panel-message">{copy.daily.empty}</p>
  ) : (
    <>
      <p className="panel-note">{copy.daily.intro}</p>
      <ul className="mission-list scrolling">
        {past.map((p) => (
          <li className="mission-row" key={p.key}>
            <span className="mission-icon"><ActivityImg id={p.activityId} /></span>
            <div className="mission-info">
              <strong>{p.label}</strong>
              <small>{p.where}</small>
            </div>
            <button
              type="button"
              className="btn-chip btn-chip-primary"
              onClick={() => {
                setPick(p);
                setDWhen(WHEN_OPTIONS[0]);
                setDWhere(p.where);
              }}
            >
              {copy.daily.pick}
            </button>
          </li>
        ))}
      </ul>
      {rest}
    </>
  );

  // ---------- 하루 설계 ----------
  const design = (
    <>
      <label className="field">
        <span>{copy.design.wish}</span>
        <input
          id="design-wish"
          className="text-input"
          type="text"
          maxLength={40}
          value={wish}
          placeholder={copy.design.wishPlaceholder}
          aria-label={copy.design.wish}
          onChange={(e) => setWish(e.target.value)}
        />
      </label>
      <div className="field-row">
        <label className="field narrow">
          <span>{copy.design.when}</span>
          <select id="design-when" className="text-input" aria-label={copy.design.when} value={gWhen} onChange={(e) => setGWhen(e.target.value)}>
            {WHEN_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{copy.design.criterion}</span>
          <input
            id="design-criterion"
            className="text-input"
            type="text"
            maxLength={40}
            value={criterion}
            placeholder={copy.design.criterionPlaceholder}
            aria-label={copy.design.criterion}
            onChange={(e) => setCriterion(e.target.value)}
          />
        </label>
      </div>
      <p className="panel-note">{copy.design.note}</p>
      <div className="btn-pair">
        <button
          type="button"
          className="btn btn-primary"
          disabled={wish.trim() === ''}
          onClick={() => {
            const p = designPlan(wish, gWhen, criterion);
            if (p) confirmPlan(p);
          }}
        >
          {copy.design.save}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setTab('mission');
            setDraft(undefined);
          }}
        >
          {copy.design.again}
        </button>
      </div>
    </>
  );

  return (
    <section className="panel activity-panel" role="dialog" aria-label={copy.panel.title}>
      <PanelHead
        left={back ? <IconBtn name="back" label={copy.panel.back} onClick={back} /> : undefined}
        center={tabs}
      />
      {tab === 'mission' ? mission : tab === 'daily' ? daily : design}
      {tab !== 'design' && <p className="panel-note">{copy.panel.footnote}</p>}
    </section>
  );
}

export const openActivityPanel = (opts: PanelOptions = {}) => openModal(<ActivityPanel opts={opts} />);
