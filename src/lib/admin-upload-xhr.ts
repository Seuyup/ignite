import {
  ADMIN_UPLOAD_CACHE_CONTROL,
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
} from "@/lib/admin-upload";
import { resizeImageForUpload } from "@/lib/client-image-resize";

export type AdminUploadProgress = {
  phase: "uploading" | "processing";
  loaded: number;
  total: number;
  /** 여러 파일 업로드 시 1-based 순번 (선택) */
  batchIndex?: number;
  /** 여러 파일 업로드 시 총 개수 (선택) */
  batchTotal?: number;
};

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

type SignedUpload = { uploadUrl: string; key: string; publicUrl: string };

/** 사전 서명 URL 발급 (JSON 수백 바이트 — 함수 본문 제한과 무관) */
async function requestSignedUpload(
  filename: string,
  contentType: string,
  size: number,
): Promise<SignedUpload> {
  const res = await fetch("/api/admin/upload/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ filename, contentType, size }),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<SignedUpload> & {
    error?: string;
  };
  if (!res.ok || !data.uploadUrl || !data.publicUrl) {
    throw new Error(data.error ?? `업로드 URL 발급 실패 (HTTP ${res.status})`);
  }
  return data as SignedUpload;
}

/** R2로 직접 PUT — XHR을 써서 전송 진행률을 보고한다. */
function putToR2(
  uploadUrl: string,
  body: Blob,
  contentType: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("cache-control", ADMIN_UPLOAD_CACHE_CONTROL);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(ev.loaded, ev.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        new Error(
          `스토리지 업로드에 실패했습니다. (HTTP ${xhr.status}) R2 버킷의 CORS 설정을 확인해 주세요.`,
        ),
      );
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "스토리지에 연결하지 못했습니다. 네트워크 상태와 R2 버킷 CORS 설정을 확인해 주세요.",
        ),
      );
    xhr.onabort = () => reject(new Error("업로드가 취소되었습니다."));

    xhr.send(body);
  });
}

/**
 * 관리자 이미지 업로드.
 *
 * 1) `processing` — 브라우저에서 이미지를 축소(긴 변 2400px)
 * 2) `uploading`  — 사전 서명 URL로 R2에 직접 전송
 *
 * 파일 본문이 Next.js 서버를 거치지 않으므로 Vercel Functions의
 * 요청 본문 4.5MB 제한(FUNCTION_PAYLOAD_TOO_LARGE)에 걸리지 않는다.
 */
export async function postAdminImageUpload(
  file: File,
  onProgress: (p: AdminUploadProgress) => void,
): Promise<UploadResult> {
  if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      error: `파일 크기는 ${ADMIN_UPLOAD_MAX_LABEL} 이하여야 합니다.`,
    };
  }

  try {
    onProgress({ phase: "processing", loaded: 0, total: file.size });

    const resized = await resizeImageForUpload(file);
    const body: Blob = resized?.blob ?? file;
    const contentType =
      resized?.contentType ||
      (file.type || "application/octet-stream").split(";")[0]?.trim() ||
      "application/octet-stream";
    const filename = resized
      ? `${file.name.replace(/\.[^/.]+$/i, "") || "image"}.${resized.extension}`
      : file.name;

    const signed = await requestSignedUpload(filename, contentType, body.size);

    onProgress({ phase: "uploading", loaded: 0, total: body.size });
    await putToR2(signed.uploadUrl, body, contentType, (loaded, total) =>
      onProgress({ phase: "uploading", loaded, total }),
    );

    return { ok: true, url: signed.publicUrl };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "업로드에 실패했습니다.",
    };
  }
}
