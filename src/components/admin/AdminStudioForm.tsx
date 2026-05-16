"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateStudioAction,
  type StudioFormState,
} from "@/lib/actions/studio-actions";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";
import { NAVER_MAP_TYPE_OPTIONS, DEFAULT_MAP_CONFIG } from "@/lib/map-tiles";
import type { StudioLocation } from "@/lib/ignite-data";

const initial: StudioFormState = { error: null };

type Props = {
  initialBodyTop: string;
  initialBodyBottom: string;
  initialLocation: StudioLocation;
};

export function AdminStudioForm({
  initialBodyTop,
  initialBodyBottom,
  initialLocation,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateStudioAction,
    initial,
  );
  const getHtmlTopRef = useRef<() => string>(() => initialBodyTop);
  const getHtmlBottomRef = useRef<() => string>(() => initialBodyBottom);

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state.saved, router]);

  const [lat, setLat] = useState(initialLocation?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initialLocation?.lng?.toString() ?? "");
  const [mapType, setMapType] = useState(
    initialLocation?.mapType ?? DEFAULT_MAP_CONFIG.mapType,
  );
  const [zoom, setZoom] = useState(
    initialLocation?.zoom?.toString() ?? "16",
  );
  const [showZoomControl, setShowZoomControl] = useState(
    initialLocation?.showZoomControl ?? DEFAULT_MAP_CONFIG.showZoomControl,
  );
  const [showScaleControl, setShowScaleControl] = useState(
    initialLocation?.showScaleControl ?? DEFAULT_MAP_CONFIG.showScaleControl,
  );
  const [showMapTypeControl, setShowMapTypeControl] = useState(
    initialLocation?.showMapTypeControl ?? DEFAULT_MAP_CONFIG.showMapTypeControl,
  );
  const [scrollWheel, setScrollWheel] = useState(
    initialLocation?.scrollWheel ?? DEFAULT_MAP_CONFIG.scrollWheel,
  );
  const [draggable, setDraggable] = useState(
    initialLocation?.draggable ?? DEFAULT_MAP_CONFIG.draggable,
  );

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const topEl = form.elements.namedItem("bodyTop");
        if (topEl && topEl instanceof HTMLInputElement) {
          topEl.value = getHtmlTopRef.current();
        }
        const bottomEl = form.elements.namedItem("bodyBottom");
        if (bottomEl && bottomEl instanceof HTMLInputElement) {
          bottomEl.value = getHtmlBottomRef.current();
        }
      }}
    >
      {/* ━━━ 구역 1: 상단 HTML ━━━ */}
      <section className="relative rounded-lg border-2 border-blue-200 bg-blue-50/30">
        <SectionBadge label="상단 영역" color="blue" position="top" />
        <div className="p-5 pt-8">
          <h2 className="mb-1 text-sm font-semibold text-blue-800">
            상단 콘텐츠 (HTML)
          </h2>
          <p className="mb-4 text-xs text-blue-600/70">
            지도 위에 표시될 HTML 콘텐츠입니다. 비워두면 이 영역은 표시되지 않습니다.
          </p>
          <ProjectHtmlEditor
            getHtmlRef={getHtmlTopRef}
            initialHtml={initialBodyTop}
          />
          <input type="hidden" name="bodyTop" defaultValue={initialBodyTop} />
        </div>
      </section>

      {/* ━━━ 구역 간 연결선 ━━━ */}
      <SectionConnector />

      {/* ━━━ 구역 2: 지도 ━━━ */}
      <section className="relative rounded-lg border-2 border-emerald-200 bg-emerald-50/30">
        <SectionBadge label="지도 영역" color="emerald" position="top" />
        <div className="p-5 pt-8 space-y-5">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-emerald-800">
              위치 정보
            </h2>
            <p className="mb-4 text-xs text-emerald-600/70">
              위도/경도를 비워두면 지도가 표시되지 않습니다.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="loc-lat"
                  className="mb-1 block text-xs text-neutral-500"
                >
                  위도 (Latitude)
                </label>
                <input
                  id="loc-lat"
                  name="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="37.4882"
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="loc-lng"
                  className="mb-1 block text-xs text-neutral-500"
                >
                  경도 (Longitude)
                </label>
                <input
                  id="loc-lng"
                  name="lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="127.0338"
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="loc-zoom"
                className="mb-1 block text-xs text-neutral-500"
              >
                줌 레벨 (1~20, 숫자가 클수록 확대)
              </label>
              <input
                id="loc-zoom"
                name="zoom"
                type="number"
                min={1}
                max={20}
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>

            <p className="mt-3 text-xs text-neutral-400">
              네이버 지도에서 주소를 검색 후 우클릭하면 좌표를 확인할 수 있습니다.
            </p>
          </div>

          <hr className="border-emerald-200" />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-emerald-800">
              지도 설정
            </h3>

            <div>
              <label
                htmlFor="loc-mapType"
                className="mb-1 block text-xs text-neutral-500"
              >
                지도 유형
              </label>
              <select
                id="loc-mapType"
                name="mapType"
                value={mapType}
                onChange={(e) => setMapType(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              >
                {NAVER_MAP_TYPE_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-neutral-500">
                컨트롤 표시
              </p>
              <CheckboxField
                id="showZoomControl"
                name="showZoomControl"
                checked={showZoomControl}
                onChange={setShowZoomControl}
                label="줌 컨트롤 (+/− 버튼)"
              />
              <CheckboxField
                id="showScaleControl"
                name="showScaleControl"
                checked={showScaleControl}
                onChange={setShowScaleControl}
                label="축척 컨트롤 (스케일 바)"
              />
              <CheckboxField
                id="showMapTypeControl"
                name="showMapTypeControl"
                checked={showMapTypeControl}
                onChange={setShowMapTypeControl}
                label="지도 유형 컨트롤 (일반/위성 전환)"
              />
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-neutral-500">
                사용자 인터랙션
              </p>
              <CheckboxField
                id="scrollWheel"
                name="scrollWheel"
                checked={scrollWheel}
                onChange={setScrollWheel}
                label="마우스 스크롤 줌"
              />
              <CheckboxField
                id="draggable"
                name="draggable"
                checked={draggable}
                onChange={setDraggable}
                label="드래그 이동"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 구역 간 연결선 ━━━ */}
      <SectionConnector />

      {/* ━━━ 구역 3: 하단 HTML ━━━ */}
      <section className="relative rounded-lg border-2 border-amber-200 bg-amber-50/30">
        <SectionBadge label="하단 영역" color="amber" position="top" />
        <div className="p-5 pt-8">
          <h2 className="mb-1 text-sm font-semibold text-amber-800">
            하단 콘텐츠 (HTML)
          </h2>
          <p className="mb-4 text-xs text-amber-600/70">
            지도 아래에 표시될 HTML 콘텐츠입니다. 비워두면 이 영역은 표시되지 않습니다.
          </p>
          <ProjectHtmlEditor
            getHtmlRef={getHtmlBottomRef}
            initialHtml={initialBodyBottom}
          />
          <input type="hidden" name="bodyBottom" defaultValue={initialBodyBottom} />
        </div>
      </section>

      {/* ━━━ 상태 메시지 & 저장 ━━━ */}
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-green-600">저장되었습니다.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}

/* ── 구역 배지 ── */

const BADGE_COLORS = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
} as const;

function SectionBadge({
  label,
  color,
  position,
}: {
  label: string;
  color: keyof typeof BADGE_COLORS;
  position: "top";
}) {
  return (
    <span
      className={`absolute ${position === "top" ? "-top-2.5 left-4" : ""} inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_COLORS[color]}`}
    >
      {label}
    </span>
  );
}

/* ── 구역 간 연결선 ── */

function SectionConnector() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex flex-col items-center gap-0.5 text-neutral-300">
        <div className="h-3 w-px bg-neutral-300" />
        <svg
          className="h-3 w-3"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 0L12 6H0z" transform="rotate(180 6 6)" />
        </svg>
      </div>
    </div>
  );
}

/* ── 체크박스 필드 ── */

function CheckboxField({
  id,
  name,
  checked,
  onChange,
  label,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
      />
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  );
}
