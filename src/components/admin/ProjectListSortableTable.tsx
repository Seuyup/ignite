"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { R2Image } from "@/components/R2Image";
import { ProjectListHeaderActions } from "@/components/admin/ProjectListHeaderActions";
import {
  type AdminProjectRow,
  projectListDisplayDate,
} from "@/lib/admin-project-shared";
import {
  softDeleteProjectAction,
  type IdActionState,
} from "@/lib/actions/admin-project-list-actions";

type Props = {
  items: AdminProjectRow[];
  page: number;
  limit: number;
  q: string;
  trashCount: number;
};

const initialAction: IdActionState = { error: null };

const DRAG_THRESHOLD_PX = 6;

function reorderIds(ids: string[], from: number, to: number): string[] {
  const next = [...ids];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
}

/** 위·아래 정렬용 쌍삭표(양쪽 대칭) */
function MoveOrderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10L12 6l4 4M8 14l4 4 4-4"
      />
    </svg>
  );
}

function OpenProjectIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5h10.5a2.25 2.25 0 002.25-2.25V13.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 4.5h4.5V9M19.5 4.5L10.5 13.5"
      />
    </svg>
  );
}

function EditProjectIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function TrashSmallIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

/** 포인터 Y가 어느 행 슬롯에 해당하는지 (행 중앙 기준) */
function hoverIndexFromClientY(
  clientY: number,
  rows: HTMLTableRowElement[],
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

function DeleteRowButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending || disabled}
      title="휴지통으로 이동"
      aria-label="휴지통으로 이동"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={() => {
        if (!window.confirm("이 프로젝트를 휴지통으로 옮길까요?")) return;
        start(async () => {
          const fd = new FormData();
          fd.append("id", id);
          const r = await softDeleteProjectAction(initialAction, fd);
          if (r.error) window.alert(r.error);
          else router.refresh();
        });
      }}
    >
      {pending ? (
        <span className="text-[10px] text-neutral-500">…</span>
      ) : (
        <TrashSmallIcon className="h-4 w-4" />
      )}
    </button>
  );
}

type GhostState = {
  id: string;
  top: number;
  left: number;
  width: number;
};

export function ProjectListSortableTable({
  items,
  page,
  limit,
  q,
  trashCount,
}: Props) {
  const router = useRouter();
  const itemIdsKey = useMemo(() => items.map((r) => r.id).join(","), [items]);
  const [order, setOrder] = useState(() => items.map((r) => r.id));
  const orderRef = useRef(order);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [ghost, setGhost] = useState<GhostState | null>(null);

  /** idle | pending(임계값 전) | dragging */
  const dragPhaseRef = useRef<"idle" | "pending" | "dragging">("idle");
  const pendingRef = useRef<{
    id: string;
    x0: number;
    y0: number;
    offsetX: number;
    offsetY: number;
    width: number;
  } | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  orderRef.current = order;

  useEffect(() => {
    setOrder(items.map((r) => r.id));
    orderRef.current = items.map((r) => r.id);
  }, [itemIdsKey, items]);

  const map = useMemo(
    () => new Map(items.map((r) => [r.id, r] as const)),
    [items],
  );

  const serverIds = useMemo(() => items.map((r) => r.id), [items]);
  const isOrderDirty = useMemo(
    () => order.join(",") !== serverIds.join(","),
    [order, serverIds],
  );

  /** 서버 기준 순번과 현재 인덱스가 다른 행(순서 편집 감지) */
  const positionChangedIds = useMemo(() => {
    const s = new Set<string>();
    order.forEach((id, newIdx) => {
      const oldIdx = serverIds.indexOf(id);
      if (oldIdx !== -1 && oldIdx !== newIdx) s.add(id);
    });
    return s;
  }, [order, serverIds]);

  const persistOrder = useCallback(
    async (newOrder: string[]) => {
      setSaving(true);
      try {
        const res = await fetch("/api/admin/projects/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            page,
            limit,
            q,
            orderedIds: newOrder,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          window.alert(data.error ?? "순서 저장에 실패했습니다.");
          return;
        }
        router.refresh();
      } finally {
        setSaving(false);
      }
    },
    [limit, page, q, router],
  );

  const endPointerListenersRef = useRef<(() => void) | null>(null);

  const cleanupPointerSession = useCallback(() => {
    endPointerListenersRef.current?.();
    endPointerListenersRef.current = null;
    dragPhaseRef.current = "idle";
    pendingRef.current = null;
    draggingIdRef.current = null;
    setGhost(null);
    document.body.style.removeProperty("touch-action");
    document.body.style.removeProperty("user-select");
  }, []);

  const attachPointerSession = useCallback(
    (id: string, startEvent: React.PointerEvent<HTMLElement>) => {
      cleanupPointerSession();

      const row = startEvent.currentTarget.closest("tr");
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const offsetX = startEvent.clientX - rect.left;
      const offsetY = startEvent.clientY - rect.top;

      pendingRef.current = {
        id,
        x0: startEvent.clientX,
        y0: startEvent.clientY,
        offsetX,
        offsetY,
        width: rect.width,
      };
      dragPhaseRef.current = "pending";
      draggingIdRef.current = id;

      const onMove = (ev: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending) return;

        if (dragPhaseRef.current === "pending") {
          const dx = ev.clientX - pending.x0;
          const dy = ev.clientY - pending.y0;
          if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
            return;
          }
          dragPhaseRef.current = "dragging";
          document.body.style.touchAction = "none";
          document.body.style.userSelect = "none";
          setGhost({
            id: pending.id,
            top: ev.clientY - pending.offsetY,
            left: ev.clientX - pending.offsetX,
            width: pending.width,
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

        const dragId = draggingIdRef.current;
        if (!dragId) return;

        const rows = rowRefs.current.filter(
          (r): r is HTMLTableRowElement => r != null,
        );
        if (rows.length !== orderRef.current.length) return;

        const hoverIdx = hoverIndexFromClientY(ev.clientY, rows);
        const fromIdx = orderRef.current.indexOf(dragId);
        if (fromIdx < 0 || hoverIdx < 0 || fromIdx === hoverIdx) return;

        setOrder((prev) => {
          const next = reorderIds(prev, fromIdx, hoverIdx);
          orderRef.current = next;
          return next;
        });
      };

      const onUp = () => {
        cleanupPointerSession();
      };

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
    [cleanupPointerSession],
  );

  const onMoveGripPointerDown = useCallback(
    (id: string, e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      attachPointerSession(id, e);
    },
    [attachPointerSession],
  );

  useEffect(() => () => cleanupPointerSession(), [cleanupPointerSession]);

  const ghostRow = ghost ? map.get(ghost.id) : undefined;

  const saveOrder = useCallback(() => {
    void persistOrder([...orderRef.current]);
  }, [persistOrder]);

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={!isOrderDirty || saving}
          onClick={saveOrder}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 enabled:border-neutral-900 enabled:bg-neutral-900 enabled:text-white enabled:hover:opacity-90"
        >
          {saving ? "저장 중…" : "순서 저장"}
        </button>
        <ProjectListHeaderActions trashCount={trashCount} />
      </div>
      <div
        className={`relative overflow-x-auto rounded-lg border border-neutral-200${ghost ? " select-none" : ""}`}
      >
      {saving ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-xs font-medium text-neutral-700">
          순서 저장 중…
        </div>
      ) : null}
      {typeof document !== "undefined" && ghost && ghostRow
        ? createPortal(
            <table
              className="pointer-events-none fixed z-[9999] border-collapse rounded-lg border border-neutral-300 bg-white text-left text-sm shadow-lg ring-1 ring-black/10"
              style={{
                top: ghost.top,
                left: ghost.left,
                width: ghost.width,
              }}
            >
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="w-11 px-1 py-2 align-middle">
                    <span className="flex justify-center text-neutral-400">
                      <MoveOrderIcon className="h-5 w-5" />
                    </span>
                  </td>
                  <td className="w-11 px-1 py-2 text-center align-middle text-xs tabular-nums text-neutral-500">
                    {serverIds.indexOf(ghost.id) + 1}
                  </td>
                  <td className="w-20 px-2 py-2 align-middle">
                    {ghostRow.coverImageUrl ? (
                      <R2Image
                        src={ghostRow.coverImageUrl}
                        alt=""
                        mode="fixed"
                        width={56}
                        height={56}
                        className="rounded-lg border border-neutral-200 object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <span
                        className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-[10px] text-neutral-400"
                        aria-hidden
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {ghostRow.title}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <code className="text-xs">{ghostRow.slug}</code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                    {projectListDisplayDate(ghostRow).toLocaleString("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">…</td>
                </tr>
              </tbody>
            </table>,
            document.body,
          )
        : null}
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-100 text-xs uppercase tracking-[0.1em] text-neutral-500">
            <th
              colSpan={2}
              className="w-[5.5rem] px-2 py-3 text-center text-[11px] font-medium normal-case tracking-normal text-neutral-500"
            >
              이동/순서
            </th>
            <th className="w-20 px-2 py-3 font-medium whitespace-nowrap">
              이미지
            </th>
            <th className="px-4 py-3 font-medium">제목</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">수정일</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">작업</th>
          </tr>
        </thead>
        <tbody>
          {order.map((id, index) => {
            const row = map.get(id);
            if (!row) return null;
            const isDragSource = ghost?.id === id;
            const originalRank = serverIds.indexOf(id) + 1;
            const rowMoved = positionChangedIds.has(id);
            return (
              <tr
                key={id}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                style={
                  isDragSource
                    ? { visibility: "hidden" }
                    : { visibility: "visible" }
                }
                title="이동 아이콘을 드래그해 순서를 맞춘 뒤 위쪽 순서 저장으로 반영합니다"
                className={[
                  "border-b border-neutral-100 last:border-b-0",
                  rowMoved
                    ? "bg-sky-500/[0.12] hover:bg-sky-500/[0.18]"
                    : "hover:bg-neutral-50/80",
                ].join(" ")}
              >
                <td className="px-1 py-2 align-middle">
                  <button
                    type="button"
                    disabled={saving}
                    aria-label="순서 이동"
                    onPointerDown={(e) => onMoveGripPointerDown(id, e)}
                    className="mx-auto flex h-9 w-9 cursor-grab items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-100 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MoveOrderIcon className="h-5 w-5" />
                  </button>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm tabular-nums text-neutral-600">
                  {originalRank > 0 ? originalRank : "—"}
                </td>
                <td className="px-2 py-2 align-middle">
                  {row.coverImageUrl ? (
                    <R2Image
                      src={row.coverImageUrl}
                      alt=""
                      mode="fixed"
                      width={56}
                      height={56}
                      className="rounded-lg border border-neutral-200 object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <span
                      className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-[10px] text-neutral-400"
                      aria-label="이미지 없음"
                    >
                      —
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {row.title}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  <code className="text-xs">{row.slug}</code>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                  {projectListDisplayDate(row).toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div
                    className={`flex flex-wrap items-center gap-1${saving ? " pointer-events-none opacity-50" : ""}`}
                  >
                    <Link
                      href={`/projects/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="새 탭에서 열기"
                      aria-label="새 탭에서 열기"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                    >
                      <OpenProjectIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/projects/modify?slug=${encodeURIComponent(row.slug)}`}
                      title="수정"
                      aria-label="수정"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                    >
                      <EditProjectIcon className="h-4 w-4" />
                    </Link>
                    <DeleteRowButton id={id} disabled={saving} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
