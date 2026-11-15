import { activityById } from '../core/activities';
import { todayKey } from '../core/clock';
import { copy } from '../core/copy';
import { events, type HudAction } from '../core/events';
import { todayKey as today } from '../core/clock';
import { giftAvailable } from '../core/economy';
import { isResting, limitReached, pendingPacketCount } from '../core/rules';
import { store } from '../core/store';
import { btn, el } from './dom';
import { mountJoystick } from './Joystick';
import { activityImg, iconImg, type UiIcon } from './icons';

function hudButton(className: string, id: HudAction, label: string, icon: UiIcon): HTMLButtonElement {
  const b = el('button', `${className} interactive`);
  b.type = 'button';
  b.append(iconImg(icon, 'icon'), el('span', 'label', label));
  b.addEventListener('click', () => events.emit('hud-action', { id }));
  return b;
}

function bubbleText(): string {
  const date = todayKey();
  const s = store.state;
  if (isResting(s, date)) return copy.bubble.rest;
  if (limitReached(s, date)) return copy.bubble.enough;
  return s.days[date]?.plan ? copy.bubble.planned : copy.bubble.ask;
}

function renderCard(card: HTMLElement): void {
  const date = todayKey();
  const s = store.state;
  const head = el('div', 'card-title');
  head.append(el('span', '', copy.card.title), iconImg('leaf', 'leaf'));
  card.replaceChildren(head);
  const say = (text: string, sub: string) => {
    card.append(el('p', 'card-message', text), el('p', 'card-sub', sub));
  };
  const act = (id: HudAction) => () => events.emit('hud-action', { id });

  if (isResting(s, date)) {
    say(copy.card.resting, copy.card.restingSub);
    card.append(btn('btn btn-secondary', copy.card.unrest, () => events.emit('hud-action', { id: 'other-activity' })));
    return;
  }
  if (limitReached(s, date)) {
    say(copy.card.enough, copy.card.enoughSub);
    return;
  }
  const plan = s.days[date]?.plan;
  if (!plan) {
    say(copy.card.empty, '');
    card.append(btn('btn btn-primary', copy.card.pick, act('other-activity')));
    return;
  }
  const a = activityById(plan.activityId);
  const row = el('div', 'card-activity');
  const text = el('div');
  text.append(el('strong', '', a?.name ?? plan.text ?? ''), el('small', '', [plan.info.when, plan.info.where || plan.info.criterion].filter(Boolean).join(' · ')));
  row.append(activityImg(plan.activityId, 'card-icon'), text);
  const pair = el('div', 'btn-pair');
  pair.append(btn('btn btn-secondary', copy.card.confirm, act('plan-check')), btn('btn btn-secondary', copy.card.other, act('other-activity')));
  card.append(row, btn('btn btn-primary', copy.card.done, act('done')), pair);
}

export function mountHud(root: HTMLElement): void {
  const name = el('div', 'garden-name');
  name.append(el('strong', '', copy.garden.name), el('span', '', copy.garden.tagline));

  const top = el('div', 'top-buttons');
  top.append(
    hudButton('hud-btn', 'shop', copy.hud.shop, 'flag'),
    hudButton('hud-btn', 'records', copy.hud.records, 'records'),
    hudButton('hud-btn', 'decorate', copy.hud.decorate, 'decorate'),
    hudButton('hud-btn', 'settings', copy.hud.settings, 'settings'),
  );

  const bubble = el('div', 'bubble', bubbleText());
  bubble.setAttribute('role', 'status');
  events.on('player-screen', ({ x, y, zoom }) => {
    bubble.style.left = `${Math.min(Math.max(x, 80), 764)}px`;
    // 새싹이 키(72px)가 배율만큼 커지므로 머리 위로 그만큼 올린다
    bubble.style.top = `${Math.max(y - 72 * zoom - 10, 56)}px`;
  });

  const card = el('section', 'activity-card interactive');
  card.setAttribute('aria-label', copy.card.title);
  renderCard(card);

  // 왼쪽 위 묶음: 열매, 씨앗 주머니, 방문 선물(받을 게 있을 때만 보인다. 개수나 기한은 보여 주지 않는다)
  const fruit = el('div', 'fruit-badge');
  const packet = hudButton('packet-btn', 'packet', copy.packet.button, 'packet');
  const gift = hudButton('packet-btn gift-btn', 'gift', copy.hud.gift, 'check');
  const stack = el('div', 'left-stack');
  stack.append(fruit, packet, gift);
  const syncStack = () => {
    const n = pendingPacketCount(store.state);
    packet.hidden = n === 0;
    packet.querySelector('.label')!.textContent = n > 1 ? `${copy.packet.button} ${n}` : copy.packet.button;
    gift.hidden = !giftAvailable(store.state, today());
    fruit.replaceChildren(iconImg('leaf', 'fruit-icon'), el('span', '', copy.hud.fruit(store.state.fruit)));
  };
  syncStack();

  store.subscribe(() => {
    renderCard(card);
    bubble.textContent = bubbleText();
    syncStack();
  });

  root.append(name, top, stack, bubble, card, hudButton('talk-btn', 'talk', copy.hud.talk, 'talk'));
  mountJoystick(root);
}
