"use client";

import { useActionState, useRef, useState } from "react";
import {
  updateStudioAction,
  type StudioFormState,
} from "@/lib/actions/studio-actions";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";
import { MAP_TILES } from "@/lib/map-tiles";
import type { StudioLocation } from "@/lib/ignite-data";

const initial: StudioFormState = { error: null };

type Props = {
  initialBody: string;
  initialLocation: StudioLocation;
};

export function AdminStudioForm({ initialBody, initialLocation }: Props) {
  const [state, formAction, pending] = useActionState(
    updateStudioAction,
    initial,
  );
  const getHtmlRef = useRef<() => string>(() => initialBody);

  const [lat, setLat] = useState(initialLocation?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initialLocation?.lng?.toString() ?? "");
  const [address, setAddress] = useState(initialLocation?.address ?? "");
  const [mapTile, setMapTile] = useState(
    initialLocation?.mapTile ?? "stadia_stamen_toner",
  );
  const [zoom, setZoom] = useState(
    initialLocation?.zoom?.toString() ?? "16",
  );

  return (
    <form
      action={formAction}
      className="space-y-8"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const el = form.elements.namedItem("body");
        if (el && el instanceof HTMLInputElement) {
          el.value = getHtmlRef.current();
        }
      }}
    >
      {/* 1. 위치 정보 */}
      <div className="rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-700">
          위치 정보 (Location)
        </h2>

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
            htmlFor="loc-address"
            className="mb-1 block text-xs text-neutral-500"
          >
            주소
          </label>
          <input
            id="loc-address"
            name="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="서울특별시 강남구 도곡로2길 14"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
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
          위도/경도를 비워두면 지도가 표시되지 않습니다. Google Maps에서 주소를
          검색 후 우클릭하면 좌표를 확인할 수 있습니다.
        </p>
      </div>

      {/* 2. 지도 스타일 */}
      <div className="rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-700">
          지도 스타일 (Map Style)
        </h2>

        <select
          id="loc-tile"
          name="mapTile"
          value={mapTile}
          onChange={(e) => setMapTile(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <optgroup label="한글">
            {MAP_TILES.filter((t) => t.lang === "ko").map((tile) => (
              <option key={tile.key} value={tile.key}>
                {tile.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="영문">
            {MAP_TILES.filter((t) => t.lang === "en").map((tile) => (
              <option key={tile.key} value={tile.key}>
                {tile.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 3. HTML 콘텐츠 */}
      <div className="rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-700">
          콘텐츠 (HTML)
        </h2>
        <ProjectHtmlEditor
          getHtmlRef={getHtmlRef}
          initialHtml={initialBody}
        />
        <input type="hidden" name="body" defaultValue={initialBody} />
      </div>

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
