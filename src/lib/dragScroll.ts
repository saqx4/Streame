export function dragScroll(node: HTMLElement) {
   let isPointerDown = false;
  let isDragging = false;
  let dragged = false;
  let startX = 0;
  let startScrollLeft = 0;
  const DRAG_THRESHOLD_PX = 6;

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isPointerDown = true;
    isDragging = false;
    dragged = false;
    startX = e.clientX;
    startScrollLeft = node.scrollLeft;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isPointerDown) return;
    const dx = e.clientX - startX;

    if (!isDragging && Math.abs(dx) >= DRAG_THRESHOLD_PX) {
      isDragging = true;
      dragged = true;
      node.classList.add('dragging');
    }

    if (!isDragging) return;
    node.scrollLeft = startScrollLeft - dx;
  };

  const end = () => {
    isPointerDown = false;
    isDragging = false;
    node.classList.remove('dragging');
  };

  const onClickCapture = (e: MouseEvent) => {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
    dragged = false;
  };

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
  node.addEventListener('pointerleave', end);
  node.addEventListener('click', onClickCapture, true);

  return {
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', end);
      node.removeEventListener('pointercancel', end);
      node.removeEventListener('pointerleave', end);
      node.removeEventListener('click', onClickCapture, true);
    },
  };
}
