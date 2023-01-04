import { Fragment, useEffect, useState } from "react";
import classNames from "classnames";
import dynamic from "next/dynamic";
import { Graph3D } from "../components/Graph3D/Graph3D";
import { GraphEquation3D } from "../components/Graph3D/GraphEquation3D";
import { GraphEquation3DShader } from "../components/Graph3D/GraphEquation3DShader";
import { GraphGrid3D } from "../components/Graph3D/GraphGrid3D";
import { GraphAxis3D } from "../components/Graph3D/GraphAxis3D";
import { GraphBoundingBox3D } from "../components/Graph3D/GraphBoundingBox3D";
import Link from "next/link";

const MathLiveInput = dynamic(
  () => import("../components/MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

type Item =
  | {
      type: "equation";
      equation: string;
      color: "red" | "blue";
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
    },
    {
      id: 1,
      type: "equation",
      equation: "x^2+y^2=9",
      color: "blue",
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

  return (
    <div className="grid grid-cols-[300px,1fr] grid-rows-[auto,1fr] w-screen h-screen">
      <div className="flex justify-between items-center col-span-full bg-gray-800 px-4 py-3">
        <Link href="/">
          <h1 className="text-gray-100 font-medium text-lg">
            🍪 Josh's Graphing Calculator
          </h1>
        </Link>
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
      </div>
      <div className="relative overflow-hidden">
        <Graph3D>
          {({ dimension }) => {
            return (
              <>
                <GraphGrid3D normalAxis="z" />
                <GraphAxis3D axis="x" />
                <GraphAxis3D axis="y" />
                <GraphAxis3D axis="z" />
                <GraphBoundingBox3D />
                {items.map((item) => (
                  <Fragment key={item.id}>
                    {item.type === "expression" && (
                      // <GraphExpression3D expression={item.expression} />
                      <GraphEquation3DShader expression={item.expression} />
                    )}
                  </Fragment>
                ))}
                {items.map((item) => (
                  <Fragment key={item.id}>
                    {item.type === "equation" && (
                      <GraphEquation3D
                        equation={item.equation}
                        color={item.color}
                      />
                    )}
                  </Fragment>
                ))}
              </>
            );
          }}
        </Graph3D>
      </div>
    </div>
  );
}

<cylinderGeometry args={[0.6, 0.6, 2, 32, 1, true]} />;

// const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

interface EquationInputProps {
  equation: string;
  setEquation: (equation: string) => void;
  color: "red" | "blue";
  setColor: (color: "red" | "blue") => void;
  deleteSelf: () => void;
}

function EquationInput({
  equation,
  setEquation,
  color,
  setColor,
  deleteSelf,
}: EquationInputProps) {
  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 p-2 flex items-center">
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
      <MathLiveInput
        latex={equation}
        onChange={(latex) => {
          setEquation(latex);
        }}
        options={{}}
        wrapperDivClassName="block w-full flex-grow self-center focus-within:outline"
        className="px-3 py-4 outline-none"
        style={
          color === "red"
            ? "--hue: 0; --selection-background-color-focused: rgb(220 38 38 / 0.2); --selection-color-focused: rgb(127 29 29 / 1);"
            : color === "blue"
            ? "--hue: 222; --selection-background-color-focused: rgb(37 99 235 / 0.2); --selection-color-focused: rgb(30 58 138 / 1);"
            : undefined
        }
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
  const rainbowHue = useRainbowHue();

  const colorOptions = ["red", "blue", "rainbow"] as const;

  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 p-2 flex items-center">
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
      <MathLiveInput
        latex={expression}
        onChange={(latex) => {
          setExpression(latex);
        }}
        options={{}}
        wrapperDivClassName="block w-full flex-grow self-stretch focus-within:outline"
        className="px-3 py-4 outline-none"
        style={
          color === "rainbow"
            ? `--hue: ${rainbowHue}; --selection-background-color-focused: hsla(${rainbowHue}, 100%, 50%, 0.2); --selection-color-focused: hsl(${rainbowHue}, 100%, 25%);`
            : color === "red"
            ? "--hue: 0; --selection-background-color-focused: rgb(220 38 38 / 0.2); --selection-color-focused: rgb(127 29 29 / 1);"
            : color === "blue"
            ? "--hue: 222; --selection-background-color-focused: rgb(37 99 235 / 0.2); --selection-color-focused: rgb(30 58 138 / 1);"
            : undefined
        }
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

function useRainbowHue() {
  const [rainbowHue, setRainbowHue] = useState(0);
  useEffect(() => {
    let done = false;

    function updateSelectionColor() {
      if (done) return;
      requestAnimationFrame(updateSelectionColor);

      const t = (Date.now() / 4000) % 1;
      setRainbowHue(t * 360);
    }

    updateSelectionColor();

    return () => {
      done = true;
    };
  }, []);

  return rainbowHue;
}
