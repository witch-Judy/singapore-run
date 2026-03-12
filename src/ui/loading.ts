export function setLoadProgress(pct: number, status: string): void {
  const bar = document.getElementById('load-bar') as HTMLElement;
  const statusEl = document.getElementById('load-status') as HTMLElement;
  if (bar) bar.style.width = `${pct}%`;
  if (statusEl) statusEl.textContent = status;
}

export function hideLoading(): void {
  const el = document.getElementById('loading');
  if (el) el.classList.add('hidden');
  const hud = document.getElementById('hud');
  if (hud) hud.classList.add('active');
}
