import { Fragment, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import useSize from "@react-hook/size";
import { Graph } from "../components/Graph";
import { GraphExpression } from "../components/GraphExpression";
import { GraphEquation } from "../components/GraphEquation";
import { GraphGrid } from "../components/GraphGrid";
import dynamic from "next/dynamic";

const MathLiveInput = dynamic(
  () => import("../components/MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

type Item =
  | {
      type: "equation";
      equation: string;
      color: "red" | "blue";
      depth: string;
      searchDepth: string;
    }
  | {
      type: "expression";
      expression: string;
      color: "rainbow" | "red" | "blue";
    };

type ItemWithId = { id: number } & Item;

export default function Index() {
  const [items, setItems] = useState<ItemWithId[]>([
    {
      id: 0,
      type: "equation",
      equation: "y=x^2",
      color: "red",
      depth: "7",
      searchDepth: "3",
    },
    {
      id: 1,
      type: "equation",
      equation: "x^2+y^2=25",
      color: "blue",
      depth: "7",
      searchDepth: "3",
    },
    // { id: 2, type: "expression", expression: "x^2+y^2", color: "rainbow" },
  ]);

  const setItem = (item: ItemWithId, newItem: ItemWithId) => {
    setItems((items) => {
      const index = items.indexOf(item);
      return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
    });
  };

  const setProp = <T extends ItemWithId, PropName extends keyof T>(
    item: T,
    propName: PropName,
    value: T[PropName]
  ) => {
    setItem(item, { ...item, [propName]: value });
  };

  const insertItem = (item: Item, index = items.length) => {
    setItems((items) => {
      const newItem: ItemWithId = {
        ...item,
        id: Math.max(...items.map((item) => item.id)) + 1,
      };

      return [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    });
  };

  const deleteItem = (index: number) => {
    setItems((items) => [...items.slice(0, index), ...items.slice(index + 1)]);
  };

  const graphContainerRef = useRef(null);
  const [width, height] = useSize(graphContainerRef);

  const [debug, setDebug] = useState(false);

  return (
    <div className="grid grid-cols-[300px,1fr] grid-rows-[auto,1fr] w-screen h-screen">
      <div className="flex justify-between items-center col-span-full bg-gray-800 px-4 py-3">
        <h1 className="text-gray-100 font-medium text-lg">
          🍪 Josh's Graphing Calculator
        </h1>
        <span className="text-gray-500">I can't believe it's not Desmos!</span>
      </div>
      <div className="flex flex-col border-r shadow-lg">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {item.type === "equation" && (
              <EquationInput
                equation={item.equation}
                setEquation={(newEquation) =>
                  setProp(item, "equation", newEquation)
                }
                color={item.color}
                setColor={(newColor) => setProp(item, "color", newColor)}
                deleteSelf={() => deleteItem(index)}
                depth={item.depth}
                setDepth={(newDepth) => {
                  if (BigInt(newDepth) < 0) {
                    newDepth = "0";
                  }
                  if (BigInt(newDepth) > 8) {
                    newDepth = "8";
                  }
                  setItem(item, {
                    ...item,
                    depth: newDepth,
                    searchDepth:
                      BigInt(newDepth) < BigInt(item.searchDepth)
                        ? newDepth
                        : item.searchDepth,
                  });
                }}
                searchDepth={item.searchDepth}
                setSearchDepth={(newSearchDepth) => {
                  if (BigInt(newSearchDepth) < 0) {
                    newSearchDepth = "0";
                  }
                  if (BigInt(newSearchDepth) > 5) {
                    newSearchDepth = "5";
                  }
                  setItem(item, {
                    ...item,
                    depth:
                      BigInt(item.depth) < BigInt(newSearchDepth)
                        ? newSearchDepth
                        : item.depth,
                    searchDepth: newSearchDepth,
                  });
                }}
              />
            )}
            {item.type === "expression" && (
              <ExpressionInput
                expression={item.expression}
                setExpression={(newExpression) => {
                  setProp(item, "expression", newExpression);
                }}
                color={item.color}
                setColor={(newColor) => setProp(item, "color", newColor)}
                deleteSelf={() => deleteItem(index)}
              />
            )}
          </Fragment>
        ))}
        <div className="flex mt-4 space-x-2 justify-center">
          <button
            onClick={() =>
              insertItem({
                type: "equation",
                equation: "y=x",
                color: "red",
                depth: "7",
                searchDepth: "3",
              })
            }
            disabled={items.length >= 4}
            className="bg-gray-100 border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add equation
          </button>
          <button
            onClick={() =>
              insertItem({
                type: "expression",
                expression: "x^2+y^2",
                color: "rainbow",
              })
            }
            disabled={items.length >= 4}
            className="bg-gray-100 border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add expression
          </button>
        </div>
        <div className="mt-auto p-4">
          <label className="flex items-center space-x-1">
            <input
              className="w-4 h-4"
              type="checkbox"
              checked={debug}
              onChange={(event) => setDebug(event.target.checked)}
            />
            <span>Debug mode</span>
          </label>
        </div>
      </div>
      <div
        ref={graphContainerRef}
        className="flex items-center justify-center overflow-hidden"
      >
        <Graph width={width} height={height}>
          {items.map((item) => (
            <Fragment key={item.id}>
              {item.type === "expression" && (
                <GraphExpression
                  expression={item.expression}
                  color={item.color}
                />
              )}
            </Fragment>
          ))}
          <GraphGrid />
          {items.map((item) => (
            <Fragment key={item.id}>
              {item.type === "equation" && (
                <GraphEquation
                  equation={item.equation}
                  color={item.color}
                  depth={BigInt(item.depth)}
                  searchDepth={BigInt(item.searchDepth)}
                />
              )}
            </Fragment>
          ))}
        </Graph>
      </div>
    </div>
  );
}

interface EquationInputProps {
  equation: string;
  setEquation: (equation: string) => void;
  color: "red" | "blue";
  setColor: (color: "red" | "blue") => void;
  deleteSelf: () => void;
  depth: string;
  setDepth: (depth: string) => void;
  searchDepth: string;
  setSearchDepth: (searchDepth: string) => void;
}

function EquationInput({
  equation,
  setEquation,
  color,
  setColor,
  deleteSelf,
  depth,
  setDepth,
  searchDepth,
  setSearchDepth,
}: EquationInputProps) {
  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 py-4 px-2">
        <button
          onClick={() => setColor(color === "red" ? "blue" : "red")}
          className={classNames("block w-6 h-6 rounded-full", {
            "bg-red-600": color === "red",
            "bg-blue-600": color === "blue",
          })}
        >
          <span className="sr-only">Change color</span>
        </button>
      </div>
      <div
        className={classNames(
          "block w-full flex-grow self-stretch px-3 py-2 focus:outline-none",
          {
            "selection:bg-red-600/20 selection:text-red-900": color === "red",
            "selection:bg-blue-600/20 selection:text-blue-900":
              color === "blue",
          }
        )}
      >
        <MathLiveInput
          latex={equation}
          onChange={(latex) => {
            setEquation(latex);
          }}
          options={{}}
        />
        <div>
          Depth:{" "}
          <input
            type="number"
            value={depth}
            onChange={(event) => setDepth(event.target.value)}
          />
          Search depth:{" "}
          <input
            type="number"
            value={searchDepth}
            onChange={(event) => setSearchDepth(event.target.value)}
          />
        </div>
      </div>
      {/* <input
        className={classNames(
          "block w-full flex-grow self-stretch px-3 py-2 focus:outline-none",
          {
            "selection:bg-red-600/20 selection:text-red-900": color === "red",
            "selection:bg-blue-600/20 selection:text-blue-900":
              color === "blue",
          }
        )}
        type="text"
        value={equation}
        onChange={(event) => {
          setEquation(event.target.value);
        }}
      /> */}
      <button
        onClick={() => deleteSelf()}
        className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 flex items-center justify-center"
      >
        <span className="sr-only">Delete</span>
        <span className="not-sr-only text-xs text-gray-600">X</span>
      </button>
    </div>
  );
}

interface ExpressionInputProps {
  expression: string;
  setExpression: (expression: string) => void;
  color: "rainbow" | "red" | "blue";
  setColor: (color: "rainbow" | "red" | "blue") => void;
  deleteSelf: () => void;
}

function ExpressionInput({
  expression,
  setExpression,
  color,
  setColor,
  deleteSelf,
}: ExpressionInputProps) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  // Rainbow text selection effect
  useEffect(() => {
    if (!input) return;

    const stylesheet = document.createElement("style");
    document.body.appendChild(stylesheet);

    let done = false;

    function updateSelectionColor() {
      if (done) return;
      requestAnimationFrame(updateSelectionColor);

      const t = (Date.now() / 4000) % 1;
      stylesheet.innerHTML = `
        .rainbowSelectionInput::selection {
          background-color: hsla(${t * 360}, 100%, 50%, 0.2);
          color: hsl(${t * 360}, 100%, 25%);
        }
      `;
    }

    updateSelectionColor();

    return () => {
      document.body.removeChild(stylesheet);
      done = true;
    };
  }, [input]);

  const colorOptions = ["red", "blue", "rainbow"] as const;

  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 py-4 px-2">
        <button
          onClick={() =>
            setColor(
              colorOptions[
                (colorOptions.indexOf(color) + 1) % colorOptions.length
              ]
            )
          }
          className={classNames("block w-6 h-6 rounded-full", {
            "bg-red-600": color === "red",
            "bg-blue-600": color === "blue",
          })}
          style={{
            backgroundImage:
              color === "rainbow"
                ? `conic-gradient(
                    rgba(255, 0, 0, 1) 0%,
                    rgba(255, 154, 0, 1) 10%,
                    rgba(208, 222, 33, 1) 20%,
                    rgba(79, 220, 74, 1) 30%,
                    rgba(63, 218, 216, 1) 40%,
                    rgba(47, 201, 226, 1) 50%,
                    rgba(28, 127, 238, 1) 60%,
                    rgba(95, 21, 242, 1) 70%,
                    rgba(186, 12, 248, 1) 80%,
                    rgba(251, 7, 217, 1) 90%,
                    rgba(255, 0, 0, 1) 100%
                  )`
                : undefined,
          }}
        >
          <span className="sr-only">Change color</span>
        </button>
      </div>
      <input
        ref={setInput}
        className={classNames(
          "block w-full flex-grow self-stretch px-3 py-2 focus:outline-none",
          {
            rainbowSelectionInput: color === "rainbow",
            "selection:bg-red-600/20 selection:text-red-900": color === "red",
            "selection:bg-blue-600/20 selection:text-blue-900":
              color === "blue",
          }
        )}
        type="text"
        value={expression}
        onChange={(event) => setExpression(event.target.value)}
      />
      <button
        onClick={() => deleteSelf()}
        className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 flex items-center justify-center"
      >
        <span className="sr-only">Delete</span>
        <span className="not-sr-only text-xs text-gray-600">X</span>
      </button>
    </div>
  );
}
