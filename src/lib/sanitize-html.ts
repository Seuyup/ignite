import DOMPurify from "isomorphic-dompurify";

/** HTML 특수문자를 escape 해 그대로 보여준다 (정제 실패 시 폴백) */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 공개 페이지에 삽입할 사용자 작성 HTML 정제.
 *
 * DOMPurify 는 서버에서 jsdom 위에서 돈다. 그 환경이 틀어지면 여기서 예외가 나고,
 * 이 함수를 쓰는 페이지가 통째로 500 이 된다 (2026-09-28 Vercel 이관 직후
 * `/studio` · `/contact` · `/p/[slug]` 가 그랬다).
 *
 * 정제가 실패하면 **escape 한 평문**으로 떨어진다. 모양은 깨지지만 페이지는 살고,
 * 정제되지 않은 HTML 을 내보내지 않으므로 XSS 로 번지지도 않는다.
 * 원인은 로그에 남긴다 — 조용히 넘어가면 또 못 찾는다.
 */
export function sanitizeRichHtml(html: string): string {
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["img"],
      ADD_ATTR: ["target", "rel", "class"],
    });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    console.error(
      `[sanitize] DOMPurify 실패: ${e?.name ?? "Error"} ${e?.message ?? String(err)}`,
    );
    return escapeHtml(html);
  }
}

/** @deprecated 이름 호환 — `sanitizeRichHtml`과 동일 */
export const sanitizeProjectHtml = sanitizeRichHtml;
