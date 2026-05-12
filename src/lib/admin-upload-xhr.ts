import { parseAdminUploadResponse } from "@/lib/admin-upload";

export type AdminUploadProgress = {
  phase: "uploading" | "processing";
  loaded: number;
  total: number;
};

/**
 * 관리자 이미지 업로드 (쿠키 포함). XHR로 전송 진행률을 알 수 있어
 * `uploading`(바이트 전송) / `processing`(서버 압축·R2 저장·응답 대기)를 구분합니다.
 */
export function postAdminImageUpload(
  file: File,
  onProgress: (p: AdminUploadProgress) => void,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.withCredentials = true;

    xhr.upload.onloadstart = () => {
      onProgress({ phase: "uploading", loaded: 0, total: file.size });
    };

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onProgress({
          phase: "uploading",
          loaded: ev.loaded,
          total: ev.total,
        });
      }
    };

    xhr.upload.onload = () => {
      onProgress({ phase: "processing", loaded: file.size, total: file.size });
    };

    xhr.onload = () => {
      void (async () => {
        try {
          const res = new Response(xhr.responseText, { status: xhr.status });
          const data = await parseAdminUploadResponse(res);
          if (!res.ok) {
            resolve({
              ok: false,
              error: data.error ?? "업로드에 실패했습니다.",
            });
            return;
          }
          if (!data.url) {
            resolve({ ok: false, error: "URL이 반환되지 않았습니다." });
            return;
          }
          resolve({ ok: true, url: data.url });
        } catch {
          resolve({
            ok: false,
            error: "응답을 처리하는 중 오류가 발생했습니다.",
          });
        }
      })();
    };

    xhr.onerror = () => {
      resolve({ ok: false, error: "네트워크 오류가 발생했습니다." });
    };

    xhr.onabort = () => {
      resolve({ ok: false, error: "업로드가 취소되었습니다." });
    };

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}
