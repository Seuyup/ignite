/**
 * 본문 HTML에서 `<img>` 목록·삭제를 다룹니다. (DOMParser, document 순서)
 */

export type HtmlBodyImageEntry = {
  /** `document.querySelectorAll("img")` 기준 순번 (삭제 시 동일 인덱스로 제거) */
  domIndex: number;
  src: string;
};

function isEmptyishBlock(el: Element): boolean {
  const inner = el.innerHTML.replace(/\s|&nbsp;/gi, "").toLowerCase();
  return inner === "" || inner === "<br>" || inner === "<br/>";
}

/**
 * `text/html`로 파싱한 `body` 안의 모든 `img`를 문서 순서대로 반환합니다.
 * `src`가 비어 있으면 빈 문자열로 두고(목록·삭제 인덱스는 유지), UI에서만 처리합니다.
 */
export function extractImgEntriesFromHtml(html: string): HtmlBodyImageEntry[] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html ?? "", "text/html");
  const imgs = Array.from(doc.body.querySelectorAll("img"));
  return imgs.map((el, domIndex) => ({
    domIndex,
    src: el.getAttribute("src")?.trim() ?? "",
  }));
}

/**
 * `domIndex`번째 `img` 노드를 제거한 뒤 `body.innerHTML`을 반환합니다.
 */
export function removeImgAtIndexFromHtml(html: string, domIndex: number): string {
  if (typeof window === "undefined") return html;
  try {
    const doc = new DOMParser().parseFromString(html ?? "", "text/html");
    const imgs = Array.from(doc.body.querySelectorAll("img"));
    const target = imgs[domIndex];
    if (!target) return html;

    const parent = target.parentElement;
    target.remove();

    if (parent && parent !== doc.body && parent.tagName === "P") {
      if (isEmptyishBlock(parent)) parent.remove();
    }

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}
