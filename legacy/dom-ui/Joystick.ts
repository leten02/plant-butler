import { events } from '../core/events';

const RADIUS = 36; // 노브가 움직일 수 있는 반경(px)
const DEAD = 0.18;

/** 화면용 가상 조이스틱. 방향 벡터를 'move-input' 이벤트로 내보낸다. */
export function mountJoystick(root: HTMLElement): void {
  const base = document.createElement('div');
  base.className = 'joystick interactive';
  base.setAttribute('aria-hidden', 'true');
  const knob = document.createElement('div');
  knob.className = 'joystick-knob';
  base.append(
    ...['up', 'down', 'left', 'right'].map((d) => Object.assign(document.createElement('i'), { className: `arrow ${d}` })),
    knob,
  );
  root.append(base);

  let activeId: number | null = null;
  const reset = () => {
    activeId = null;
    knob.style.transform = 'translate(-50%, -50%)';
    events.emit('move-input', { x: 0, y: 0 });
  };
  const update = (e: PointerEvent) => {
    const rect = base.getBoundingClientRect();
    // CSS 확대 배율을 보정해 논리 좌표로 환산
    const scale = rect.width / base.offsetWidth;
    let dx = (e.clientX - (rect.left + rect.width / 2)) / scale;
    let dy = (e.clientY - (rect.top + rect.height / 2)) / scale;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / RADIUS;
    const ny = dy / RADIUS;
    events.emit('move-input', Math.hypot(nx, ny) < DEAD ? { x: 0, y: 0 } : { x: nx, y: ny });
  };

  base.addEventListener('pointerdown', (e) => {
    activeId = e.pointerId;
    base.setPointerCapture(e.pointerId);
    update(e);
  });
  base.addEventListener('pointermove', (e) => {
    if (e.pointerId === activeId) update(e);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    base.addEventListener(type, (e) => {
      if (e.pointerId === activeId) reset();
    });
  }
}
