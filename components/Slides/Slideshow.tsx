"use client";

import { Children, createContext, useContext, useRef, useState } from "react";
import { SlideProps } from "./Slide";
import classNames from "classnames";
import { useResizeObserver } from "../../hooks/useResizeObserver";

type SlideshowMode = "editing" | "presenting";

type NestedArraysOf<T> = T | NestedArraysOf<T>[];

interface SlideshowProps {
  children: NestedArraysOf<React.ReactElement<SlideProps>>;

  mode: SlideshowMode;
}

interface SlideshowContext {
  mode: SlideshowMode;
}

const SlideshowContext = createContext<SlideshowContext | null>(null);

export function useSlideshowContext() {
  const context = useContext(SlideshowContext);
  if (!context) {
    throw new Error(
      "useSlideshowContext must be used within a SlideshowProvider"
    );
  }
  return context;
}

export function Slideshow({ children, mode }: SlideshowProps) {
  const slideshowWrapperRef = useRef<HTMLSelectElement>(null);
  const [slideContainerRef, size] = useResizeObserver<HTMLDivElement>();

  const slides = Children.toArray(children) as React.ReactElement<SlideProps>[];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fullscreenElement: Element | null =
    globalThis.document?.fullscreenElement ?? null;

  const fullscreenEnabled: boolean =
    globalThis.document?.fullscreenEnabled ?? true;

  return (
    <SlideshowContext.Provider value={{ mode }}>
      <section
        className={classNames("w-full", {
          border: !fullscreenElement,
        })}
        ref={slideshowWrapperRef}
      >
        <div
          ref={slideContainerRef}
          className="aspect-video w-full overflow-hidden relative"
          style={
            {
              "--slide-container-width": size.width,
              "--slide-container-height": size.height,
            } as React.CSSProperties
          }
        >
          {slides[currentSlideIndex]}
        </div>
        <div className="bg-gray-100 flex items-center">
          <div className="p-2">
            <button
              className="bg-gray-200 rounded-l-lg px-3 h-8 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentSlideIndex((i) => i - 1)}
              disabled={currentSlideIndex === 0}
            >
              ←
            </button>
            <select
              className="bg-gray-200 px-3 h-8 border-y border-gray-300 cursor-pointer"
              value={currentSlideIndex}
              onChange={(event) => {
                setCurrentSlideIndex(parseInt(event.target.value));
              }}
            >
              {slides.map((slide, i) => (
                <option key={i} value={i}>
                  {i + 1}: {slide.props.title}
                </option>
              ))}
            </select>
            <button
              className="bg-gray-200 rounded-r-lg px-3 h-8 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentSlideIndex((i) => i + 1)}
              disabled={currentSlideIndex === slides.length - 1}
            >
              →
            </button>
          </div>
          <div className="ml-auto p-2">
            <button
              className="hover:bg-gray-300 p-1 rounded block"
              onClick={() => {
                if (fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  slideshowWrapperRef.current?.requestFullscreen();
                }
              }}
              disabled={!fullscreenEnabled}
              title={
                fullscreenEnabled
                  ? fullscreenElement
                    ? "Exit Fullscreen"
                    : "Fullscreen"
                  : "Fullscreen is not supported"
              }
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <g
                  className="stroke-black"
                  fill="none"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {fullscreenElement ? (
                    <>
                      <path d="M 2,8 L 8,8 L 8,2" />
                      <path d="M 22,8 L 16,8 L 16,2" />
                      <path d="M 2,16 L 8,16 L 8,22" />
                      <path d="M 22,16 L 16,16 L 16,22" />
                    </>
                  ) : (
                    <>
                      <path d="M 2,8 L 2,2 L 8,2" />
                      <path d="M 22,8 L 22,2 L 16,2" />
                      <path d="M 2,16 L 2,22 L 8,22" />
                      <path d="M 22,16 L 22,22 L 16,22" />
                    </>
                  )}
                </g>
              </svg>
            </button>
          </div>
        </div>
      </section>
    </SlideshowContext.Provider>
  );
}
