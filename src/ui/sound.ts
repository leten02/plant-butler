// 효과음. 파일 없이 브라우저에서 짧은 음을 합성한다. 진짜 소리가 오면 play()만 바꾸면 된다.
import { events } from '../core/events';
import { store } from '../core/store';

type Note = [freq: number, at: number, length: number];

const SOUNDS: Record<string, Note[]> = {
  tap: [[520, 0, 0.05]],
  open: [[392, 0, 0.1], [523, 0.09, 0.14]],
  plant: [[294, 0, 0.09], [392, 0.08, 0.12]],
  harvest: [[523, 0, 0.09], [659, 0.08, 0.09], [784, 0.16, 0.16]],
  buy: [[440, 0, 0.08], [587, 0.08, 0.14]],
  gift: [[587, 0, 0.1], [740, 0.09, 0.1], [880, 0.18, 0.18]],
};

let ctx: AudioContext | null = null;

function play(name: string): void {
  if (!store.state.settings.sound || !ctx) return;
  const now = ctx.currentTime;
  for (const [freq, at, length] of SOUNDS[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.07, now + at + 0.012); // 재촉하는 느낌이 없게 작고 부드럽게
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + length + 0.02);
  }
}

export function startSound(): void {
  // 브라우저는 사용자가 누른 뒤에만 소리를 허락한다.
  document.addEventListener('pointerdown', (e) => {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if ((e.target as HTMLElement).closest?.('button')) play('tap');
  });
  events.on('sfx', ({ name }) => play(name));
  events.on('harvested', () => play('harvest'));
  events.on('plant-grown', () => play('plant'));
}
