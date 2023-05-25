"use client";

import { Slideshow } from "../../../components/Slides/Slideshow";
import { Slide, SlideProps } from "../../../components/Slides/Slide";
import { Box } from "../../../components/Slides/Box";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Graph3D } from "../../../components/Graph3D/Graph3D";
import { GraphEquation3D } from "../../../components/Graph3D/GraphEquation3D";
import { GraphGrid3D } from "../../../components/Graph3D/GraphGrid3D";
import { GraphAxis3D } from "../../../components/Graph3D/GraphAxis3D";

const MathQuillInput = dynamic(
  () =>
    import("../../../components/MathQuillInput").then(
      (mod) => mod.MathQuillInput
    ),
  { ssr: false }
);

export default function Test() {
  const [slideshowFile, setSlideshowFile] = useState<SlideshowFile>({
    slides: [
      {
        items: [
          {
            id: "0",
            type: "text",
            content: "What are the roots of this polynomial?",
            x: 50,
            y: 50,
            width: 1180,
            height: 100,
          },
          {
            id: "1",
            type: "equation",
            latex: "x^2 + 2x + 1 = 0",
            fontSize: 48,
            x: 1280 / 2 - 400 / 2,
            y: 720 / 2 - 100 / 2,
            width: 400,
            height: 100,
          },
          {
            id: "2",
            type: "graph",
            latex: "y = x^2 + 2x + 1",
            x: 50,
            y: 185,
            width: 500,
            height: 500,
          },
        ],
      },
      {
        items: [
          {
            id: "3",
            type: "text",
            content:
              "Many bridges are built with frames of steel beams. Steel is very strong, but any beam will bend or break if you put too much weight on it.",
            x: 50,
            y: 50,
            width: 1180,
            height: 100,
          },
          {
            id: "4",
            type: "image",
            src: "https://images.unsplash.com/photo-1429041966141-44d228a42775?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            alt: "A steel bridge",
            x: 50,
            y: 185,
            width: 700,
            height: 500,
          },
        ],
      },
    ],
  });

  const [editing, setEditing] = useState(false);

  const updateItem = (
    itemId: string,
    changes: Partial<SlideshowFileSlideItem>
  ) => {
    setSlideshowFile((file) => {
      const slideIndex = file.slides.findIndex((slide) => {
        return slide.items.some((item) => item.id === itemId);
      });

      if (slideIndex === -1) {
        throw new Error(`Item ${itemId} not found`);
      }

      const itemIndex = file.slides[slideIndex].items.findIndex(
        (item) => item.id === itemId
      );

      return {
        ...file,
        slides: [
          ...file.slides.slice(0, slideIndex),
          {
            ...file.slides[slideIndex],
            items: [
              ...file.slides[slideIndex].items.slice(0, itemIndex),
              {
                ...file.slides[slideIndex].items[itemIndex],
                ...changes,
              } as SlideshowFileSlideItem,
              ...file.slides[slideIndex].items.slice(itemIndex + 1),
            ],
          },
          ...file.slides.slice(slideIndex + 1),
        ],
      };
    });
  };

  const addItem = (type: string) => {
    const defaultItems: {
      [K in SlideshowFileSlideItem["type"]]: Omit<
        SlideshowFileSlideItem & { type: K },
        "id"
      >;
    } = {
      text: {
        type: "text",
        content: "New text",
        x: 50,
        y: 50,
        width: 200,
        height: 100,
      },
      image: {
        type: "image",
        src: "https://images.unsplash.com/photo-1429041966141-44d228a42775?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
        alt: "A steel bridge",
        x: 50,
        y: 50,
        width: 200,
        height: 100,
      },
      equation: {
        type: "equation",
        latex: "x^2 + 2x + 1 = 0",
        fontSize: 48,
        x: 50,
        y: 50,
        width: 400,
        height: 100,
      },
      graph: {
        type: "graph",
        latex: "y = x^2 + 2x + 1",
        x: 50,
        y: 50,
        width: 500,
        height: 500,
      },
    };

    if (!(type in defaultItems)) {
      throw new Error(`Invalid item type: ${type}`);
    }

    const item: SlideshowFileSlideItem = {
      id: crypto.randomUUID(),
      ...defaultItems[type as keyof typeof defaultItems],
    };

    setSlideshowFile((file) => {
      const currentSlideIndex = 0;

      return {
        ...file,
        slides: [
          ...file.slides.slice(0, currentSlideIndex),
          {
            ...file.slides[currentSlideIndex],
            items: [...file.slides[currentSlideIndex].items, item],
          },
          ...file.slides.slice(currentSlideIndex + 1),
        ],
      };
    });
  };

  const deleteItem = (itemId: string) => {
    setSlideshowFile((file) => {
      return {
        ...file,
        slides: file.slides.map((slide) => {
          return {
            ...slide,
            items: slide.items.filter((item) => item.id !== itemId),
          };
        }),
      };
    });
  };

  return (
    <div className="container mx-auto px-16 pt-8">
      <div className="relative">
        <Slideshow mode={editing ? "editing" : "presenting"}>
          {slideshowFile.slides.map(
            (slide, i): React.ReactElement<SlideProps> => (
              <Slide key={i} title={`Slide ${i}`} width={1280} height={720}>
                {slide.items.map((item) => (
                  <Box
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    height={item.height}
                    onChange={(x, y, width, height) => {
                      updateItem(item.id, { x, y, width, height });
                    }}
                    onDelete={() => {
                      deleteItem(item.id);
                    }}
                  >
                    {({ editingContent }) => (
                      <>
                        {item.type === "text" && (
                          <textarea
                            className="w-full h-full font-sans text-3xl p-0 m-0 bg-transparent border-none outline-none resize-none"
                            autoFocus={true}
                            value={item.content}
                            onChange={(e) => {
                              updateItem(item.id, {
                                content: e.target.value,
                              });
                            }}
                            disabled={!editingContent}
                          />
                        )}
                        {item.type === "image" && (
                          <img // eslint-disable-line @next/next/no-img-element
                            src={item.src}
                            className="w-full h-full"
                            alt={item.alt}
                          />
                        )}
                        {item.type === "equation" && (
                          <>
                            <MathQuillInput
                              className="w-full h-full !flex items-center text-center"
                              latex={item.latex}
                              onChange={(latex) => {
                                updateItem(item.id, { latex });
                              }}
                              fontSize={`${item.fontSize}px`}
                            />
                            {editingContent && (
                              <div className="absolute top-full left-0 mt-1 flex items-center space-x-1">
                                <button
                                  className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xl text-gray-700"
                                  onClick={() => {
                                    updateItem(item.id, {
                                      fontSize: item.fontSize - 1,
                                    });
                                  }}
                                >
                                  -
                                </button>
                                <span className="text-xl">{item.fontSize}</span>
                                <button
                                  className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xl text-gray-700"
                                  onClick={() => {
                                    updateItem(item.id, {
                                      fontSize: item.fontSize + 1,
                                    });
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </>
                        )}
                        {item.type === "graph" && (
                          <>
                            <Graph3D
                              view="2D"
                              allowPan={false}
                              allowZoom={false}
                            >
                              {() => (
                                <>
                                  <GraphGrid3D />
                                  <GraphAxis3D axis="x" />
                                  <GraphAxis3D axis="y" />
                                  <GraphEquation3D
                                    equation={item.latex}
                                    color="red"
                                  />
                                </>
                              )}
                            </Graph3D>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                ))}
              </Slide>
            )
          )}
        </Slideshow>

        <div>
          <label>
            Add element:{" "}
            <select
              value="---"
              onChange={(event) => addItem(event.target.value)}
            >
              <option value="---">---</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="equation">Eqution</option>
              <option value="graph">Graph</option>
            </select>
          </label>
        </div>
      </div>

      <label className="mt-8">
        <input
          type="checkbox"
          checked={editing}
          onChange={() => setEditing(!editing)}
        />
        <span className="ml-2">Editing</span>
      </label>
    </div>
  );
}

interface SlideshowFile {
  slides: SlideshowFileSlide[];
}

interface SlideshowFileSlide {
  items: SlideshowFileSlideItem[];
}

type SlideshowFileSlideItem = { id: string } & (
  | {
      type: "text";
      content: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "equation";
      latex: string;
      fontSize: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "graph";
      latex: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
);
