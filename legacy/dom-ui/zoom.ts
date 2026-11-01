// 시야(배율) 조절: 화면 아래 가운데 슬라이더, [−][+] 버튼, 마우스 휠. 폰은 손가락으로 보면 되지만 컴퓨터에서 쓰기 위한 것.
import { copy } from '../core/copy';
import { events } from '../core/events';
import { store } from '../core/store';
import { coverZoom, defaultViewZoom } from '../scene/map';
import { btn, el } from './dom';

const W = 844;
const MAX = 2;

export function mountZoom(root: HTMLElement, stage: HTMLElement): void {
  const stageH = () => parseFloat(stage.style.getPropertyValue('--stage-h')) || 390;
  const clamp = (z: number) => Math.min(MAX, Math.max(coverZoom(W, stageH()), z));
  const current = () => clamp(store.state.settings.viewZoom ?? defaultViewZoom(stageH()));

  const wrap = el('div', 'zoom-ctl interactive');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', copy.zoom.label);
  const label = el('span', 'zoom-label');
  const range = el('input', 'zoom-range');
  range.type = 'range';
  range.step = '5';
  range.setAttribute('aria-label', copy.zoom.label);

  const show = (z: number) => {
    range.min = String(Math.ceil(coverZoom(W, stageH()) * 100));
    range.max = String(MAX * 100);
    range.value = String(Math.round(z * 100));
    label.textContent = `${Math.round(z * 100)}%`;
  };
  const apply = (z: number, persist: boolean) => {
    const zoom = clamp(z);
    show(zoom);
    events.emit('view-zoom', { zoom });
    if (persist) store.update((d) => { d.settings.viewZoom = zoom; });
  };

  const wider = btn('zoom-btn', '−', () => apply(current() - 0.1, true));
  wider.setAttribute('aria-label', copy.zoom.wider);
  const closer = btn('zoom-btn', '+', () => apply(current() + 0.1, true));
  closer.setAttribute('aria-label', copy.zoom.closer);
  range.addEventListener('input', () => apply(Number(range.value) / 100, false));
  range.addEventListener('change', () => apply(Number(range.value) / 100, true));

  // 마우스 휠: 위로 굴리면 가까이, 아래로 굴리면 넓게. 창이 열려 있거나 꾸미는 중에는 쓰지 않는다.
  let saveTimer: number | undefined;
  stage.addEventListener('wheel', (e) => {
    if (document.querySelector('.modal-layer') || root.classList.contains('decorating')) return;
    e.preventDefault();
    apply(current() - Math.sign(e.deltaY) * 0.05, false);
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => store.update((d) => { d.settings.viewZoom = current(); }), 300);
  }, { passive: false });

  window.addEventListener('resize', () => show(current()));
  wrap.append(wider, range, closer, label);
  root.append(wrap);
  show(current());
}
