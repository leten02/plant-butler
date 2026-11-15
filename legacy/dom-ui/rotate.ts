import { copy } from '../core/copy';

/** 세로 화면일 때만 CSS가 보여주는 안내 */
export function mountRotateNotice(): void {
  const box = document.createElement('div');
  box.className = 'rotate-notice';
  box.setAttribute('role', 'alert');
  const icon = document.createElement('div');
  icon.className = 'rotate-icon';
  icon.textContent = '📱';
  const msg = document.createElement('p');
  msg.textContent = copy.rotate.message;
  box.append(icon, msg);
  document.body.append(box);
}
