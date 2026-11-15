// 주민과의 대화: 정해진 대사를 순서대로 보여주고, 마지막에 그 주민의 일(상점·도감·씨앗 주머니)로 이어 준다.
// 페르소나·챗봇형 대화는 팀 회의 뒤에 이 자리를 바꿔 넣는다.
import { copy } from '../core/copy';
import type { NpcId } from '../core/events';
import { pendingPacketCount } from '../core/rules';
import { store } from '../core/store';
import { btn, el } from './dom';
import { iconBtn, sproutImg, wrap } from './icons';
import { closeModal, openModal, replaceModalContent } from './modal';

type Speaker = NpcId | 'sprout';

/** 대화가 끝난 뒤 이어지는 화면. flow.ts가 채운다(화면끼리 직접 부르지 않으려고). */
export const talkActions: Partial<Record<NpcId, () => void>> = {};

export function openTalk(who: Speaker = 'nuri'): void {
  const npc = copy.talk.npc[who];
  const lines = npc.lines as readonly string[];
  let i = 0;

  const render = (): HTMLElement => {
    const box = el('section', 'panel talk');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', npc.name);

    const head = el('div', 'panel-head');
    head.append(el('span', 'icon-spacer'), el('h2', 'panel-title', npc.name), iconBtn('close', copy.panel.close, closeModal));

    const bubble = el('div', 'talk-bubble');
    bubble.append(wrap('talk-avatar', who === 'sprout' ? sproutImg() : npcBadge(who)), el('p', '', lines[i]));

    const isLast = i === lines.length - 1;
    const buttons = el('div', 'btn-pair');
    if (isLast && who !== 'sprout') {
      const action = (npc as { action?: string }).action;
      const run = talkActions[who];
      // 느리의 씨앗 주머니는 열 게 있을 때만 보인다.
      const show = who !== 'nuri' || pendingPacketCount(store.state) > 0;
      if (action && run && show) {
        buttons.append(btn('btn btn-primary', action, () => { closeModal(); run(); }));
      }
    }
    buttons.append(
      btn(isLast ? 'btn btn-secondary' : 'btn btn-primary', isLast ? copy.talk.close : copy.talk.next, () => {
        if (isLast) {
          closeModal();
          return;
        }
        i++;
        replaceModalContent(render());
      }),
    );
    box.append(head, bubble, buttons);
    return box;
  };

  openModal(render);
}

/** 그림이 오기 전까지 쓰는 이름 동그라미. 그림이 오면 이 함수만 이미지로 바꾼다. */
function npcBadge(id: NpcId): HTMLElement {
  const b = el('span', `npc-badge npc-${id}`, copy.talk.npc[id].name.slice(0, 1));
  return b;
}
