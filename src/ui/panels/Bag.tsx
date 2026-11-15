// 가방: 내가 가진 것만 종류별로 모은다(씨앗·소품·식물). 쌓인 기록은 수첩에, 살 것은 상점에 있다.
import { useState } from 'react';
import { copy } from '../../core/copy';
import { bagCounts } from '../../core/rules';
import { closeModal, isModalOpen, openModal } from '../modal';
import { useAppState } from '../useAppState';
import { enterDecorate, StorageBody } from './Decorate';
import { PanelHead } from './PanelHead';
import { SeedBoxBody } from './Packet';

export type BagTab = 'seeds' | 'decor' | 'plants';

function Bag({ initial }: { initial: BagTab }) {
  const [tab, setTab] = useState<BagTab>(initial);
  const counts = bagCounts(useAppState());
  const tabs = (
    <div className="tabs" role="tablist">
      {(['seeds', 'decor', 'plants'] as const).map((id) => (
        <button key={id} type="button" className="tab" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
          {copy.bag.tab(copy.bag[id], counts[id])}
        </button>
      ))}
    </div>
  );
  const kind = tab === 'decor' ? 'decor' : 'plant';
  return (
    <section className="panel bag" role="dialog" aria-label={copy.bag.title}>
      <PanelHead center={tabs} />
      <div className="bag-body">
        {tab === 'seeds' ? <SeedBoxBody /> : <StorageBody placeable={false} kind={kind} />}
      </div>
      {tab !== 'seeds' && counts[tab] > 0 && (
        <button type="button" className="btn btn-secondary" onClick={() => { closeModal(); enterDecorate(); }}>{copy.bag.openDecorate}</button>
      )}
    </section>
  );
}

export const openBag = (initial: BagTab = 'seeds') => {
  if (!isModalOpen()) openModal(<Bag initial={initial} />);
};
