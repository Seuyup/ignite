/**
 * 브라우저에서 업로드 전 이미지를 줄인다.
 *
 * 기존에는 서버(`sharp`)가 압축했지만, R2 직접 업로드로 전환하면서 파일이
 * 서버를 거치지 않게 되어 같은 역할을 클라이언트로 옮겼다.
 * 규칙은 sharp 구현(`optimize-upload-image.ts`)과 동일하게 맞춘다.
 * - 긴 변 2400px 이내로 축소(확대는 하지 않음)
 * - JPEG/WebP 품질 0.72
 * - 알파 없는 PNG는 JPEG 후보로 변환
 * - 결과가 원본보다 크면 사용하지 않는다(= 원본 그대로 업로드)
 */

const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.72;
const WEBP_QUALITY = 0.72;

const RESIZE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ResizedImage = {
  blob: Blob;
  contentType: string;
  extension: string;
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** 리사이즈된 캔버스에 알파 픽셀이 하나라도 있는지 검사 */
function hasAlphaPixels(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
    return false;
  } catch {
    // 교차 출처 오염 등으로 읽을 수 없으면 알파가 있다고 보고 PNG를 유지한다.
    return true;
  }
}

/**
 * 업로드용으로 축소한 이미지를 반환한다.
 * 대상이 아니거나 이득이 없으면 `null` → 호출부는 원본을 그대로 올린다.
 */
export async function resizeImageForUpload(file: File): Promise<ResizedImage | null> {
  const mime = (file.type || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (!RESIZE_MIME.has(mime)) return null;
  if (typeof createImageBitmap !== "function") return null;

  let bitmap: ImageBitmap;
  try {
    // EXIF 회전을 반영해 디코드한다(sharp의 .rotate()와 동일한 효과).
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const candidates: ResizedImage[] = [];
    const push = async (type: string, extension: string, quality?: number) => {
      const blob = await canvasToBlob(canvas, type, quality);
      // toBlob은 미지원 형식일 때 PNG로 대체하므로 실제 타입을 확인한다.
      if (blob && blob.type === type) {
        candidates.push({ blob, contentType: type, extension });
      }
    };

    if (mime === "image/jpeg") {
      await push("image/jpeg", "jpg", JPEG_QUALITY);
    } else if (mime === "image/webp") {
      await push("image/webp", "webp", WEBP_QUALITY);
    } else {
      // PNG: 알파가 없으면 JPEG 후보를 추가하고, PNG 후보와 비교한다.
      if (!hasAlphaPixels(ctx, width, height)) {
        await push("image/jpeg", "jpg", JPEG_QUALITY);
      }
      await push("image/png", "png");
    }

    let best: ResizedImage | null = null;
    for (const c of candidates) {
      if (c.blob.size >= file.size) continue;
      if (!best || c.blob.size < best.blob.size) best = c;
    }
    return best;
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}
