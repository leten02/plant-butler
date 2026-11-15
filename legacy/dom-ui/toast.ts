import { el } from './dom';

let timer: number | undefined;

export function showToast(lines: string[], ms = 5000): void {
  document.querySelector('.toast')?.remove();
  window.clearTimeout(timer);
  const toast = el('div', 'toast');
  toast.setAttribute('role', 'status');
  for (const line of lines) toast.append(el('p', '', line));
  document.getElementById('ui')!.append(toast);
  timer = window.setTimeout(() => toast.remove(), ms);
}
