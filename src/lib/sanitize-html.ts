import sanitizeHtmlLib from "sanitize-html";

/**
 * 공개 페이지에 삽입할 사용자 작성 HTML 정제.
 *
 * 예전에는 `isomorphic-dompurify` 를 썼다. 서버에서 **jsdom** 을 끌어오는데,
 * Vercel 에서 jsdom 의 의존성이 ESM/CJS 충돌로 import 단계에서 터졌다.
 *
 *   require() of ES Module .../@exodus/bytes/encoding-lite.js
 *   from .../html-encoding-sniffer/...
 *
 * 그래서 이 함수를 쓰는 세 라우트(`/studio` · `/contact` · `/p/[slug]`)만
 * 500 이었다. 로컬(Node 24)에서는 dev·production 빌드 모두 재현되지 않았다.
 *
 * `sanitize-html` 은 htmlparser2 기반 순수 JS 라 브라우저 DOM 구현이 필요 없다.
 * 서버리스에서 안전하고, 세 라우트의 추적 파일이 1,690개 → 500개대로 줄어 콜드
 * 스타트도 가벼워진다.
 *
 * **허용 목록은 기존 DOMPurify 설정(`USE_PROFILES: html` + `img` + class·target·rel)과
 * 같은 결과가 나오도록 맞췄다.** 실제 DB 콘텐츠 8건으로 두 결과를 비교해
 * 태그·속성·style 값이 모두 동일함을 확인했다(차이는 CSS 공백과 자기닫음 표기뿐).
 * 설정을 바꿀 때도 같은 방법으로 대조한다.
 */

/** DOMPurify html 프로필에 해당하는 태그 집합 (iframe·script·style 등은 제외) */
const ALLOWED_TAGS = [
  "a", "abbr", "address", "article", "aside", "b", "bdi", "bdo", "blockquote",
  "br", "caption", "cite", "code", "col", "colgroup", "dd", "del", "details",
  "dfn", "div", "dl", "dt", "em", "figcaption", "figure", "footer", "h1", "h2",
  "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "i", "img", "ins", "kbd",
  "li", "main", "mark", "nav", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s",
  "samp", "section", "small", "span", "strong", "sub", "summary", "sup",
  "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u", "ul",
  "var", "wbr",
];

/** style 안에서 막아야 하는 구문 — 외부 로드와 스크립트 실행 경로 */
const DANGEROUS_CSS = /(url\s*\(|expression\s*\(|javascript\s*:|@import)/i;

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": [
        "class", "style", "id", "title", "dir", "lang", "align",
        "width", "height", "loading", "referrerpolicy",
      ],
      a: ["href", "target", "rel", "class", "style", "id", "title", "download"],
      img: [
        "src", "srcset", "sizes", "alt", "width", "height", "loading",
        "decoding", "class", "style", "id", "title",
      ],
      td: ["colspan", "rowspan", "headers", "align", "valign"],
      th: ["colspan", "rowspan", "headers", "scope", "align", "valign"],
      ol: ["start", "type", "reversed"],
      time: ["datetime"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    // 본문은 레이아웃·타이포그래피 style 을 그대로 쓴다(관리자가 작성한 것).
    // 값 자체는 유지하되 위험한 구문만 아래 transformTags 에서 걷어낸다.
    transformTags: {
      "*": (tagName, attribs) => {
        const next: Record<string, string> = { ...attribs };
        if (typeof next.style === "string" && DANGEROUS_CSS.test(next.style)) {
          delete next.style;
        }
        if (next.target === "_blank") next.rel = "noopener noreferrer";
        return { tagName, attribs: next };
      },
    },
    // 내용까지 버릴 태그 — 텍스트만 남기면 스크립트 본문이 화면에 찍힌다
    nonTextTags: ["script", "style", "textarea", "noscript", "iframe", "object", "embed"],
  });
}

/** @deprecated 이름 호환 — `sanitizeRichHtml`과 동일 */
export const sanitizeProjectHtml = sanitizeRichHtml;
