// 방문 선물함: 접속한 날 작은 선물과 누적 방문 기념 선물. 연속 기록과 초기화가 없어서 쉬었다 와도 그대로다.
import { todayKey } from '../core/clock';
import { claimGift, giftAvailable, type GiftResult } from '../core/economy';
import { copy } from '../core/copy';
import { store } from '../core/store';
import { btn, el } from './dom';
import { iconBtn, iconImg, wrap } from './icons';
import { closeModal, openModal, replaceModalContent } from './modal';

export function openGift(): void {
  let got: GiftResult | null = null;

  const render = (): HTMLElement => {
    const box = el('section', 'panel gift');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.gift.title);
    const head = el('div', 'panel-head');
    head.append(el('span', 'icon-spacer'), el('h2', 'panel-title', copy.gift.title), iconBtn('close', copy.panel.close, closeModal));

    const art = wrap('packet-art', iconImg('packet', 'packet-img'));
    const available = giftAvailable(store.state, todayKey());
    box.append(head, art);

    if (got) {
      box.append(el('p', 'panel-message', copy.gift.got(got.fruit)));
      if (got.milestone?.reward === 'decor' && got.milestone.kind) {
        box.append(el('p', 'panel-note', copy.gift.milestoneDecor(copy.decorate.kind[got.milestone.kind])));
      } else if (got.milestone?.reward === 'packet') {
        box.append(el('p', 'panel-note', copy.gift.milestonePacket));
      }
      box.append(el('p', 'panel-note', copy.gift.count(store.state.visits.count)), btn('btn btn-primary', copy.gift.close, closeModal));
    } else if (available) {
      box.append(
        el('p', 'panel-message', copy.gift.today),
        btn('btn btn-primary', copy.gift.claim, () => {
          store.update((d) => { got = claimGift(d, todayKey()); });
          replaceModalContent(render());
        }),
        btn('btn btn-secondary', copy.gift.later, closeModal),
      );
    } else {
      box.append(
        el('p', 'panel-message', copy.gift.claimed),
        el('p', 'panel-note', copy.gift.count(store.state.visits.count)),
        btn('btn btn-primary', copy.gift.close, closeModal),
      );
    }
    return box;
  };

  openModal(render);
}
