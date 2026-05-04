import { useRef, useState, MouseEvent } from "react";

export function useDraggableScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setDragDistance(0);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    setDragDistance(Math.abs(walk));
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (dragDistance > 10) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    onClickCapture,
    className: isDragging ? "cursor-grabbing" : "cursor-grab"
  };
}
