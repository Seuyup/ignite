"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 6;

function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function hoverIndexFromClientY(
  clientY: number,
  rows: HTMLElement[],
): number {
  if (!rows.length) return 0;
  const first = rows[0].getBoundingClientRect();
  if (clientY <= first.top) return 0;
  const last = rows[rows.length - 1].getBoundingClientRect();
  if (clientY >= last.bottom) return rows.length - 1;
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (clientY < mid) return i;
  }
  return rows.length - 1;
}

export type GhostState = {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
};

type Options<T> = {
  items: T[];
  onReorder: (items: T[]) => void;
};

export function usePointerDragSort<T>({ items, onReorder }: Options<T>) {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [ghost, setGhost] = useState<GhostState | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const dragPhaseRef = useRef<"idle" | "pending" | "dragging">("idle");
  const pendingRef = useRef<{
    index: number;
    x0: number;
    y0: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const draggingIdxRef = useRef<number | null>(null);

  const endPointerListenersRef = useRef<(() => void) | null>(null);

  const cleanupPointerSession = useCallback(() => {
    endPointerListenersRef.current?.();
    endPointerListenersRef.current = null;
    dragPhaseRef.current = "idle";
    pendingRef.current = null;
    draggingIdxRef.current = null;
    setGhost(null);
    setDraggingIndex(null);
    document.body.style.removeProperty("touch-action");
    document.body.style.removeProperty("user-select");
  }, []);

  const onPointerDown = useCallback(
    (index: number, e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      cleanupPointerSession();

      const row = e.currentTarget.closest("[data-drag-item]") as HTMLElement | null;
      if (!row) return;
      const rect = row.getBoundingClientRect();

      pendingRef.current = {
        index,
        x0: e.clientX,
        y0: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      };
      dragPhaseRef.current = "pending";
      draggingIdxRef.current = index;

      const onMove = (ev: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending) return;

        if (dragPhaseRef.current === "pending") {
          const dx = ev.clientX - pending.x0;
          const dy = ev.clientY - pending.y0;
          if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
          dragPhaseRef.current = "dragging";
          setDraggingIndex(pending.index);
          document.body.style.touchAction = "none";
          document.body.style.userSelect = "none";
          setGhost({
            index: pending.index,
            top: ev.clientY - pending.offsetY,
            left: ev.clientX - pending.offsetX,
            width: pending.width,
            height: pending.height,
          });
        }

        if (dragPhaseRef.current !== "dragging") return;

        ev.preventDefault();
        setGhost((g) =>
          g
            ? {
                ...g,
                top: ev.clientY - pending.offsetY,
                left: ev.clientX - pending.offsetX,
              }
            : null,
        );

        const fromIdx = draggingIdxRef.current;
        if (fromIdx == null) return;

        const rows = itemRefs.current.filter(
          (r): r is HTMLElement => r != null,
        );
        if (rows.length !== itemsRef.current.length) return;

        const hoverIdx = hoverIndexFromClientY(ev.clientY, rows);
        if (fromIdx === hoverIdx) return;

        const reordered = reorderArray(itemsRef.current, fromIdx, hoverIdx);
        itemsRef.current = reordered;
        draggingIdxRef.current = hoverIdx;
        setDraggingIndex(hoverIdx);
        onReorder(reordered);
      };

      const onUp = () => cleanupPointerSession();

      const opts: AddEventListenerOptions = { capture: true, passive: false };
      window.addEventListener("pointermove", onMove, opts);
      window.addEventListener("pointerup", onUp, opts);
      window.addEventListener("pointercancel", onUp, opts);

      endPointerListenersRef.current = () => {
        window.removeEventListener("pointermove", onMove, opts);
        window.removeEventListener("pointerup", onUp, opts);
        window.removeEventListener("pointercancel", onUp, opts);
      };
    },
    [cleanupPointerSession, onReorder],
  );

  useEffect(() => () => cleanupPointerSession(), [cleanupPointerSession]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  return { ghost, draggingIndex, onPointerDown, setItemRef };
}
