import type { RoadGraph } from '../map/graph';

const container = () => document.getElementById('junction-ui')!;

export function showJunction(
  graph: RoadGraph,
  candidates: number[],
  _nodeIdx: number,
  onSelect: (edgeIdx: number) => void,
): void {
  const el = container();
  el.innerHTML = '';
  el.classList.add('active');

  for (const ei of candidates) {
    const edge = graph.edges[ei];
    const btn = document.createElement('button');
    btn.className = 'junction-arrow';
    btn.textContent = edge.name || '→';
    btn.title = edge.name || `Road ${ei}`;
    btn.addEventListener('click', () => {
      hideJunction();
      onSelect(ei);
    });
    el.appendChild(btn);
  }
}

export function hideJunction(): void {
  const el = container();
  el.classList.remove('active');
  el.innerHTML = '';
}
