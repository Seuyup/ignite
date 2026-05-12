import sharp from "sharp";

const OPTIMIZE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_EDGE = 2400;
const JPEG_QUALITY = 72;
const WEBP_QUALITY = 72;

/**
 * 관리자 업로드 이미지를 웹용으로 줄입니다.
 * - 결과가 **원본 바이트보다 작을 때만** 반환합니다. (아니면 null → 원본 업로드)
 * - 알파가 없는 PNG는 JPEG 후보로 변환합니다.
 */
export async function optimizeAdminUploadImage(
  input: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; mime: string; extension: string } | null> {
  const normalized = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!OPTIMIZE_MIME.has(normalized)) return null;

  try {
    const meta = await sharp(input).rotate().metadata();

    const mk = () =>
      sharp(input)
        .rotate()
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: "inside",
          withoutEnlargement: true,
        });

    const candidates: { buffer: Buffer; mime: string; extension: string }[] =
      [];

    if (normalized === "image/jpeg") {
      candidates.push({
        buffer: await mk()
          .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
          .toBuffer(),
        mime: "image/jpeg",
        extension: "jpg",
      });
    } else if (normalized === "image/webp") {
      candidates.push({
        buffer: await mk()
          .webp({ quality: WEBP_QUALITY, effort: 6 })
          .toBuffer(),
        mime: "image/webp",
        extension: "webp",
      });
    } else if (normalized === "image/png") {
      if (!meta.hasAlpha) {
        candidates.push({
          buffer: await mk()
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer(),
          mime: "image/jpeg",
          extension: "jpg",
        });
      }
      candidates.push({
        buffer: await mk()
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toBuffer(),
        mime: "image/png",
        extension: "png",
      });
    }

    let best: { buffer: Buffer; mime: string; extension: string } | null =
      null;
    for (const c of candidates) {
      if (c.buffer.length >= input.length) continue;
      if (!best || c.buffer.length < best.buffer.length) best = c;
    }

    return best;
  } catch (e) {
    console.warn("[optimize-upload-image] failed, using original", e);
  }
  return null;
}
