import Image from "next/image";

function r2PublicBase(): string {
  return (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
}

/** `next/image` 최적화를 쓸 수 있는 R2 공개 URL인지 (빌드 시 remotePatterns와 일치해야 함) */
export function isR2PublicObjectUrl(src: string): boolean {
  const base = r2PublicBase();
  if (!base) return false;
  return src === base || src.startsWith(`${base}/`);
}

type FillProps = {
  src: string;
  alt: string;
  mode: "fill";
  className?: string;
  sizes?: string;
  priority?: boolean;
};

type FixedProps = {
  src: string;
  alt: string;
  mode: "fixed";
  width: number;
  height: number;
  className?: string;
  sizes?: string;
};

/**
 * R2 공개 URL이면 `next/image`로 WebP/AVIF·해상도 맞춤 전달, 아니면 일반 img.
 */
export function R2Image(props: FillProps | FixedProps) {
  const { src, alt, className } = props;
  const optimized = isR2PublicObjectUrl(src);

  if (props.mode === "fill") {
    const fillClass = ["absolute inset-0 h-full w-full", className]
      .filter(Boolean)
      .join(" ");
    if (optimized) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          draggable={false}
          className={className}
          sizes={props.sizes ?? "(max-width: 768px) 100vw, 1200px"}
          priority={props.priority}
        />
      );
    }
    return <img src={src} alt={alt} draggable={false} className={fillClass} />;
  }

  if (optimized) {
    return (
      <Image
        src={src}
        alt={alt}
        width={props.width}
        height={props.height}
        draggable={false}
        className={className}
        sizes={props.sizes ?? `${props.width}px`}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={props.width}
      height={props.height}
      draggable={false}
      className={className}
    />
  );
}
