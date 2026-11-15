import { plantById } from '../core/plants';
import { copy } from '../core/copy';
import { events } from '../core/events';
import { todayKey } from '../core/clock';
import { openBonusPacket, openPacket, pendingPacketDates } from '../core/rules';
import { store } from '../core/store';
import type { PlantedItem } from '../core/types';
import { nextPlantSlot } from '../scene/map';
import { btn, el } from './dom';
import { closeModal, isModalOpen, openModal, replaceModalContent } from './modal';
import { iconImg, plantImg, wrap } from './icons';

/** 가장 오래된 봉투부터 연다. 꽝도 등급도 없고, 새 식물이 하나 화단에 심긴다. */
export function openPacketModal(): void {
  const date = pendingPacketDates(store.state)[0];
  // 날마다 받은 주머니가 없으면 방문 선물로 받은 특별 주머니를 연다.
  const bonus = !date && store.state.bonusPackets > 0;
  if ((!date && !bonus) || isModalOpen()) return;
  let planted: PlantedItem | null = null;
  let line: string = copy.seed.plain;

  const shell = (title: string): HTMLElement => {
    const box = el('section', 'panel packet');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', title);
    return box;
  };

  const result = (): HTMLElement => {
    const box = shell(copy.packet.arrived);
    const plant = planted ? plantById(planted.plantId) : undefined;
    box.append(
      wrap('packet-art', plant ? plantImg(plant.id, 'packet-img') : iconImg('sprout', 'packet-img')),
      el('h2', 'panel-title', plant?.name ?? copy.packet.full),
      ...(plant ? [el('p', 'panel-message', line), el('p', 'panel-note', copy.packet.planted)] : []),
      btn('btn btn-primary', copy.packet.close, closeModal),
    );
    return box;
  };

  const open = () => {
    const slot = nextPlantSlot([...store.state.garden.plants, ...store.state.garden.items]);
    const met = new Set([...store.state.garden.plants, ...store.state.garden.storage.filter((s) => s.type === 'plant')].map((p) => ('plantId' in p ? p.plantId : '')));
    store.update((d) => {
      planted = date ? openPacket(d, date, slot) : openBonusPacket(d, todayKey(), slot);
    });
    const drawn = planted ? plantById((planted as PlantedItem).plantId) : undefined;
    // 중복은 정상이다. 꽝이나 실망으로 말하지 않고 "어디에 심을까"만 묻는다.
    line = drawn && met.has(drawn.id) ? copy.seed.again : drawn?.rare ? copy.seed.rare : copy.seed.plain;
    replaceModalContent(result());
  };

  openModal(
    () => {
      const box = shell(copy.packet.arrived);
      box.append(
        wrap('packet-art', iconImg('packet', 'packet-img')),
        el('h2', 'panel-title', copy.packet.arrived),
        btn('btn btn-primary', copy.packet.open, open),
        btn('btn btn-secondary', copy.packet.later, closeModal),
      );
      return box;
    },
    true,
    () => {
      if (planted) events.emit('plant-grown', { planted });
    },
  );
}
