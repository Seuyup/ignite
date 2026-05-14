"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";
import type { HomeImage } from "@/lib/ignite-data";

type Props = { images: HomeImage[] };

export function HomeSlideshow({ images }: Props) {
  const router = useRouter();
  const swiperRef = useRef<SwiperType | null>(null);
  const [current, setCurrent] = useState(0);
  const total = images.length;

  useEffect(() => {
    setCurrent(0);
    swiperRef.current?.slideTo(0, 0);
  }, [images]);

  const handleImageClick = () => {
    const link = images[current]?.link?.trim();
    if (link) {
      const href = link.startsWith("/") ? link : `/${link}`;
      router.push(href);
    }
  };

  if (total === 0) {
    return (
      <section className="flex h-[calc(100vh-72px)] items-center justify-center bg-[#f5f5f3]">
        <p className="text-sm text-neutral-500">등록된 이미지가 없습니다.</p>
      </section>
    );
  }

  const currentHasLink = !!images[current]?.link?.trim();

  return (
    <section className="relative h-[calc(100vh-72px)] w-full bg-[#f5f5f3] md:-mt-[72px] md:h-screen md:bg-transparent">
      <div className="relative h-full overflow-hidden">
        <Swiper
          modules={[Autoplay]}
          loop={total > 1}
          autoplay={total > 1 ? { delay: 5000, disableOnInteraction: false } : false}
          speed={800}
          onSwiper={(s) => { swiperRef.current = s; }}
          onSlideChange={(s) => setCurrent(s.realIndex)}
          className="h-full w-full"
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.url} className="!flex items-center justify-center">
              <div
                className={`relative h-full max-h-[90vh] w-[86%] md:w-[80%] ${currentHasLink ? "cursor-pointer" : ""}`}
                onClick={handleImageClick}
              >
                <R2Image
                  src={img.url}
                  alt=""
                  mode="fill"
                  className="pointer-events-none object-contain"
                  sizes="80vw"
                  priority={i === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Left nav zone – PC only */}
        {total > 1 && (
          <button
            type="button"
            className="group absolute left-0 top-0 z-10 hidden h-full w-[10%] cursor-pointer items-center justify-center md:flex"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="이전 이미지"
          >
            <svg className="h-4 w-8 text-neutral-900 opacity-0 transition-opacity duration-200 group-hover:opacity-100" fill="none" viewBox="0 0 24 12" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 6H2" />
              <path d="M7 1L2 6l5 5" />
            </svg>
          </button>
        )}

        {/* Right nav zone – PC only */}
        {total > 1 && (
          <button
            type="button"
            className="group absolute right-0 top-0 z-10 hidden h-full w-[10%] cursor-pointer items-center justify-center md:flex"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="다음 이미지"
          >
            <svg className="h-4 w-8 text-neutral-900 opacity-0 transition-opacity duration-200 group-hover:opacity-100" fill="none" viewBox="0 0 24 12" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6h20" />
              <path d="M17 1l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom bar — overlaid on PC */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-end px-6 py-6 md:px-10 md:py-8">
        {total > 1 && (
          <span className="text-xs text-neutral-900">
            {current + 1} / {total}
          </span>
        )}
      </div>
    </section>
  );
}
