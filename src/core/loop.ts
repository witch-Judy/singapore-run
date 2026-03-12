export type UpdateFn = (dt: number, elapsed: number) => void;

export function startLoop(update: UpdateFn, render: () => void): void {
  let lastTime = performance.now();

  function frame(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap to 100ms
    lastTime = now;
    update(dt, now / 1000);
    render();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
