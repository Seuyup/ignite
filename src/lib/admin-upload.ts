/** 관리자 이미지 업로드 상한 — API(`route.ts`)와 동일해야 함 */
export const ADMIN_UPLOAD_MAX_BYTES = 30 * 1024 * 1024;

export const ADMIN_UPLOAD_MAX_LABEL = "30MB";

/**
 * 업로드 API 응답을 파싱합니다. JSON이 아니거나(프록시 413 HTML 등) 빈 본문일 때도
 * 사용자에게 이해 가능한 메시지를 돌려줍니다.
 */
export async function parseAdminUploadResponse(
  res: Response,
): Promise<{ url?: string; error?: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      error: `서버 응답이 비어 있습니다. (HTTP ${res.status})`,
    };
  }
  try {
    return JSON.parse(trimmed) as { url?: string; error?: string };
  } catch {
    if (res.status === 413) {
      return {
        error:
          "요청 본문이 너무 큽니다(HTTP 413). Nginx 등에서 client_max_body_size를 35MB 이상으로 설정했는지 확인해 주세요.",
      };
    }
    const preview = trimmed.slice(0, 160).replace(/\s+/g, " ");
    return {
      error: `서버 응답을 해석할 수 없습니다. (HTTP ${res.status})${preview ? ` ${preview}` : ""}`,
    };
  }
}
