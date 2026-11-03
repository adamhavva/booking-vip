"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export default function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 600, behavior: "smooth" });
  };

  return (
    <div className="group/car relative">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {children}
      </div>

      <button
        onClick={() => scroll(-1)}
        aria-label="Previous"
        className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md hover:bg-canvas md:flex"
      >
        <ChevronLeft width={18} height={18} />
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Next"
        className="absolute -right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md hover:bg-canvas md:flex"
      >
        <ChevronRight width={18} height={18} />
      </button>
    </div>
  );
}