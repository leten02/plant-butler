import { useRef } from 'react';
import { events } from '../core/events';

const RADIUS = 36; // 노브가 움직일 수 있는 반경(px)
const DEAD = 0.18;

/** 화면용 가상 조이스틱. 방향 벡터를 'move-input' 이벤트로 내보낸다. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);

  const reset = () => {
    active.current = null;
    if (knob.current) knob.current.style.transform = 'translate(-50%, -50%)';
    events.emit('move-input', { x: 0, y: 0 });
  };
  const update = (e: React.PointerEvent) => {
    const el = base.current;
    if (!el || !knob.current) return;
    const rect = el.getBoundingClientRect();
    // CSS 확대 배율을 보정해 논리 좌표로 환산
    const scale = rect.width / el.offsetWidth;
    let dx = (e.clientX - (rect.left + rect.width / 2)) / scale;
    let dy = (e.clientY - (rect.top + rect.height / 2)) / scale;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    knob.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / RADIUS;
    const ny = dy / RADIUS;
    events.emit('move-input', Math.hypot(nx, ny) < DEAD ? { x: 0, y: 0 } : { x: nx, y: ny });
  };

  return (
    <div
      className="joystick interactive"
      ref={base}
      aria-hidden="true"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => active.current === e.pointerId && update(e)}
      onPointerUp={(e) => active.current === e.pointerId && reset()}
      onPointerCancel={(e) => active.current === e.pointerId && reset()}
      onLostPointerCapture={(e) => active.current === e.pointerId && reset()}
    >
      {['up', 'down', 'left', 'right'].map((d) => <i key={d} className={`arrow ${d}`} />)}
      <div className="joystick-knob" ref={knob} />
    </div>
  );
}
