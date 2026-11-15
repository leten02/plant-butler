import { todayKey } from '../../core/clock';
import { copy } from '../../core/copy';
import { setEnergy } from '../../core/rules';
import { store } from '../../core/store';
import type { Energy } from '../../core/types';
import { closeModal, openModal } from '../modal';

function Checkin() {
  const choose = (energy: Energy) => {
    store.update((d) => setEnergy(d, todayKey(), energy));
    closeModal();
  };
  return (
    <section className="panel checkin" role="dialog" aria-label={copy.checkin.title}>
      <h2 className="panel-title">{copy.checkin.title}</h2>
      <div className="checkin-options">
        {(['heavy', 'normal', 'good'] as const).map((e) => (
          <button key={e} type="button" className="btn btn-secondary" onClick={() => choose(e)}>
            {copy.checkin[e]}
          </button>
        ))}
      </div>
      <button type="button" className="link-btn" onClick={() => choose('normal')}>
        {copy.checkin.skip}
      </button>
    </section>
  );
}

/** 하루 첫 진입 때 한 번. 지나가도 괜찮다(보통으로 친다). */
export const showCheckin = () => openModal(<Checkin />, false);
