import DOMPurify from "isomorphic-dompurify";

/** 공개 페이지에 삽입할 사용자 작성 HTML 정제 */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["img"],
    ADD_ATTR: ["target", "rel", "class"],
  });
}

/** @deprecated 이름 호환 — `sanitizeRichHtml`과 동일 */
export const sanitizeProjectHtml = sanitizeRichHtml;
