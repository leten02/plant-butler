// 주민과의 대화: 정해진 대사를 순서대로 보여주고, 마지막에 그 주민의 일(상점·도감·씨앗함)로 이어 준다.
// 페르소나·챗봇형 대화는 팀 회의 뒤에 이 자리를 바꿔 넣는다.
import { useState } from 'react';
import { todayKey } from '../../core/clock';
import { copy } from '../../core/copy';
import { canHarvest } from '../../core/economy';
import type { NpcId } from '../../core/events';
import { pendingPacketCount } from '../../core/rules';
import { store } from '../../core/store';
import { npcUrl } from '../../scene/assets';
import { SproutImg } from '../icons';
import { closeModal, openModal } from '../modal';
import { PanelHead } from './PanelHead';

type Speaker = NpcId | 'sprout';

/** 대화가 끝난 뒤 이어지는 화면. flow.ts가 채운다(화면끼리 직접 부르지 않으려고). */
export const talkActions: Partial<Record<NpcId, () => void>> = {};

export function NpcBadge({ id }: { id: NpcId }) {
  return <img className="npc-face" src={npcUrl(id, 'front')} alt="" draggable={false} aria-hidden="true" />;
}

function Talk({ who }: { who: Speaker }) {
  const npc = copy.talk.npc[who];
  // 지금 상황에 맞는 말이 있으면 맨 앞에 건넨다.
  const [lines] = useState<readonly string[]>(() => {
    const s = store.state;
    const today = todayKey();
    const first =
      who === 'nuri' && pendingPacketCount(s) + s.seeds.length > 0 ? copy.lines.seedWaiting
      : who === 'moru' && s.garden.plants.some((p) => canHarvest(p, today, s.days)) ? copy.lines.fruitReady
      : null;
    return first ? [first, ...npc.lines] : npc.lines;
  });
  const [i, setI] = useState(0);
  const isLast = i === lines.length - 1;
  const action = (npc as { action?: string }).action;
  const run = who !== 'sprout' ? talkActions[who] : undefined;
  const showAction = isLast && !!action && !!run;
  return (
    <section className="panel talk" role="dialog" aria-label={npc.name}>
      <PanelHead title={npc.name} />
      <div className="talk-bubble">
        <span className="talk-avatar">{who === 'sprout' ? <SproutImg /> : <NpcBadge id={who} />}</span>
        <p>{lines[i]}</p>
      </div>
      <div className="btn-pair">
        {showAction && (
          <button type="button" className="btn btn-primary" onClick={() => { closeModal(); run?.(); }}>
            {action}
          </button>
        )}
        <button
          type="button"
          className={isLast ? 'btn btn-secondary' : 'btn btn-primary'}
          onClick={() => (isLast ? closeModal() : setI(i + 1))}
        >
          {isLast ? copy.talk.close : copy.talk.next}
        </button>
      </div>
    </section>
  );
}

export const openTalk = (who: Speaker = 'nuri') => openModal(<Talk who={who} />);
