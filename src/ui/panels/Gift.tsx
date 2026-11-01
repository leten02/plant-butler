// 방문 선물함: 접속한 날 작은 선물과 누적 방문 기념 선물. 연속 기록과 초기화가 없어서 쉬었다 와도 그대로다.
import { useState } from 'react';
import { todayKey } from '../../core/clock';
import { claimGift, giftAvailable, giftBoard, type GiftResult } from '../../core/economy';
import { copy } from '../../core/copy';
import { events } from '../../core/events';
import { store } from '../../core/store';
import { PropImg, UiIconImg } from '../icons';
import { useAppState } from '../useAppState';

/** 도장판: 방문 횟수만큼 도장이 쌓이고, 3·7·14번째 칸에는 기념 선물이 들어 있다. 날짜가 없어서 쉬어도 빈칸이 생기지 않는다. */
function Board() {
  const state = useAppState();
  return (
    <div className="stamp-board" role="img" aria-label={`${copy.gift.board} ${copy.gift.count(state.visits.count)}`}>
      {giftBoard(state).map((c) => (
        <span key={c.n} className={`stamp${c.stamped ? ' stamp-on' : ''}${c.reward ? ' stamp-gift' : ''}`} title={c.reward ? copy.gift.boxGift : copy.gift.stamp(c.n)}>
          {c.reward ? (
            <span className={c.reward.given ? 'stamp-got' : 'stamp-wait'}>
              {c.reward.kind === 'packet' ? <UiIconImg name="packet" className="stamp-icon" /> : <PropImg kind={c.reward.decor!} className="stamp-icon" />}
            </span>
          ) : c.stamped ? (
            <UiIconImg name="sprout" className="stamp-icon" />
          ) : (
            <span className="stamp-num">{c.n}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/** 방문 선물함의 본문: 도장판, 그리고 오늘 받을 선물. 가방의 출석 탭이 쓴다. */
export function GiftBody() {
  const state = useAppState();
  const [got, setGot] = useState<GiftResult | null>(null);
  const available = giftAvailable(state, todayKey());
  return (
    <>
      <Board />
      <p className="panel-note">{copy.gift.boardNote}</p>
      {got ? (
        <>
          <p className="panel-message">{copy.gift.got(got.fruit)}</p>
          {got.milestone?.reward === 'decor' && got.milestone.kind && (
            <p className="panel-note">{copy.gift.milestoneDecor(copy.decorate.kind[got.milestone.kind])}</p>
          )}
          {got.milestone?.reward === 'packet' && <p className="panel-note">{copy.gift.milestonePacket}</p>}
          <p className="panel-note">{copy.gift.count(state.visits.count)}</p>
        </>
      ) : available ? (
        <>
          <p className="panel-message">{copy.gift.today}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              let result: GiftResult | null = null;
              store.update((d) => { result = claimGift(d, todayKey()); });
              events.emit('sfx', { name: 'gift' });
              setGot(result);
            }}
          >
            {copy.gift.claim}
          </button>
        </>
      ) : (
        <>
          <p className="panel-message">{copy.gift.claimed}</p>
          <p className="panel-note">{copy.gift.count(state.visits.count)}</p>
        </>
      )}
    </>
  );
}
