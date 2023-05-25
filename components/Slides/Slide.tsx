"use client";

import { createContext, useContext, useRef } from "react";

export interface SlideProps {
  children: React.ReactNode;

  /** The title of the slide. This will be displayed in the slide navigation. */
  title: string;

  /** The width of the slide (in px). The slide will be scaled up or down for presentation purposes,
   * but the content of the slide will be rendered in a box of this size.
   */
  width?: number;

  /** The height of the slide (in px). The slide will be scaled up or down for presentation purposes,
   * but the content of the slide will be rendered in a box of this size.
   */
  height?: number;

  /** The background color of the slide. */
  background?: string;
}

interface SlideContext {
  slideRef: React.RefObject<HTMLDivElement>;

  /** The width of the slide in px. Note that this may not match the scaled width shown on the user's screen. */
  width: number;

  /** The height of the slide in px. Note that this may not match the scaled height shown on the user's screen. */
  height: number;
}

const SlideContext = createContext<SlideContext | null>(null);

export function useSlideContext() {
  const context = useContext(SlideContext);
  if (!context) {
    throw new Error("useSlideContext must be used within a Slide");
  }
  return context;
}

export function Slide({
  children,
  title,
  width = 1280,
  height = 1280 * (9 / 16), // 720
  background = "#fff",
}: SlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={slideRef}
      className="absolute top-1/2 left-1/2"
      style={{
        width,
        height,
        transform: `translate(-50%, -50%) scale(calc(min(var(--slide-container-width) / ${width}, var(--slide-container-height) / ${height})))`,
        background,
      }}
    >
      <SlideContext.Provider value={{ slideRef, width, height }}>
        {children}
      </SlideContext.Provider>
    </div>
  );
}
