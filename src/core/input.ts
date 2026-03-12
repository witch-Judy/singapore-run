import type { InputState } from '../types';

export function createInputManager(canvas: HTMLElement): InputState {
  const state: InputState = {
    forward: false,
    left: false,
    right: false,
    dragX: 0,
    dragY: 0,
    dragging: false,
  };

  let lastX = 0;
  let lastY = 0;

  // Keyboard
  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    state.forward = true; break;
      case 'KeyA': case 'ArrowLeft':  state.left = true; break;
      case 'KeyD': case 'ArrowRight': state.right = true; break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    state.forward = false; break;
      case 'KeyA': case 'ArrowLeft':  state.left = false; break;
      case 'KeyD': case 'ArrowRight': state.right = false; break;
    }
  });

  // Mouse drag for free-look
  canvas.addEventListener('mousedown', (e) => {
    state.dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    state.dragX += (e.clientX - lastX) * 0.003;
    state.dragY += (e.clientY - lastY) * 0.003;
    state.dragY = Math.max(-0.5, Math.min(0.5, state.dragY));
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => { state.dragging = false; });

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    state.dragging = true;
    state.forward = true;
    const t = e.touches[0];
    lastX = t.clientX;
    lastY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    state.dragX += (t.clientX - lastX) * 0.003;
    state.dragY += (t.clientY - lastY) * 0.003;
    state.dragY = Math.max(-0.5, Math.min(0.5, state.dragY));
    lastX = t.clientX;
    lastY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    state.dragging = false;
    state.forward = false;
  });

  return state;
}
