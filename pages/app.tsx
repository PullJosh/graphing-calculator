import { Children, Fragment, ReactNode, useEffect, useState } from "react";
import classNames from "classnames";
import dynamic from "next/dynamic";
import { Graph3D } from "../components/Graph3D/Graph3D";
import { GraphEquation3D } from "../components/Graph3D/GraphEquation3D";
import { GraphGrid3D } from "../components/Graph3D/GraphGrid3D";
import { GraphAxis3D } from "../components/Graph3D/GraphAxis3D";
import { GraphBoundingBox3D } from "../components/Graph3D/GraphBoundingBox3D";
import { GraphExpression3D } from "../components/Graph3D/GraphExpression3D";
import { Shape, Vector2, Vector3 } from "three";
import { Area } from "../components/Graph3D/display/Area";
import { Axis } from "../types";
import { GraphVectorField3D } from "../components/Graph3D/GraphVectorField3D";
import { Menu } from "@headlessui/react";
import { Navigation } from "../components/Navigation";
import { BoxedExpression } from "@cortex-js/compute-engine";

import {
  Equation,
  Expression,
  Table,
  VectorField,
} from "../components/MathObjects";

const MathLiveInput = dynamic(
  () => import("../components/MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

const mathObjects = [Equation, Expression, Table, VectorField];

type Item =
  | Equation.ObjectDescription
  | Expression.ObjectDescription
  | Table.ObjectDescription
  | VectorField.ObjectDescription;

type ItemWithId = { id: number; visible: boolean } & Item;

const shape = new Shape([
  new Vector2(0, 0),
  new Vector2(3, 0),
  new Vector2(3, 1),
  new Vector2(1, 1),
  new Vector2(1, 2),
  new Vector2(0, 2),
]);
shape.autoClose = true;

const sliceShape = new Shape([
  new Vector2(-5, -5),
  new Vector2(-5, 5),
  new Vector2(5, 5),
  new Vector2(5, -5),
]);
sliceShape.autoClose = true;

export default function Index() {
  const [items, setItems] = useState<ItemWithId[]>([
    { id: 0, visible: true, ...Equation.defaultProps },
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
        visible: true,
      };

      return [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    });
  };

  const deleteItem = (index: number) => {
    setItems((items) => [...items.slice(0, index), ...items.slice(index + 1)]);
  };

  const [variables, setVariables] = useState<[string, number][]>([]);
  const [slices, setSlices] = useState<
    { id: number; axisVar: string; value: number }[]
  >([]);

  return (
    <div className="grid grid-cols-[300px,1fr] grid-rows-[auto,1fr] w-screen h-screen">
      <div className="col-span-full">
        <Navigation width="full" showStartGraphing={false} />
      </div>
      <div className="flex flex-col border-r shadow-lg dark:bg-gray-800 dark:border-0 dark:shadow-none">
        <div className="bg-gray-100 border-b p-2 flex justify-end">
          <div className="relative">
            <Menu>
              <Menu.Button className="p-1 rounded hover:bg-gray-200 active:bg-gray-300">
                <span className="sr-only">Add item</span>
                <span className="not-sr-only">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <line
                      x1={12}
                      y1={2}
                      x2={12}
                      y2={22}
                      className="stroke-gray-700"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={2}
                      y1={12}
                      x2={22}
                      y2={12}
                      className="stroke-gray-700"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </Menu.Button>
              <Menu.Items
                as="div"
                className="absolute z-10 top-full mt-1 right-0 w-48 bg-white shadow-lg rounded-lg p-1 space-y-1"
              >
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => insertItem({ ...Equation.defaultProps })}
                    >
                      Equation
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => insertItem({ ...Expression.defaultProps })}
                    >
                      Expression
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() =>
                        insertItem({ ...VectorField.defaultProps })
                      }
                    >
                      Vector field
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => insertItem({ ...Table.defaultProps })}
                    >
                      Table
                    </button>
                  )}
                </Menu.Item>
                <div className="border-b" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => {
                        const newName = prompt("Variable letter?");
                        if (
                          newName &&
                          !variables.some(([name]) => name === newName)
                        ) {
                          setVariables((variables) => [
                            ...variables,
                            [newName, 0],
                          ]);
                        }
                      }}
                    >
                      Slider
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => {
                        const axisVar = prompt("Slice axis (x/y/z)?");
                        if (axisVar) {
                          setSlices((slices) => [
                            ...slices,
                            {
                              id:
                                Math.max(
                                  -1,
                                  ...slices.map((slice) => slice.id)
                                ) + 1,
                              axisVar,
                              value: 0,
                            },
                          ]);
                        }
                      }}
                    >
                      Slice
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
        {items.map((item, index) => (
          <div
            key={item.id}
            className="relative flex border-b dark:border-gray-900"
          >
            <div className="bg-gray-100 dark:bg-gray-700 dark:border-r dark:border-gray-800 p-2 flex items-center">
              <button
                className="block"
                onClick={() => {
                  setItem(item, { ...item, visible: !item.visible });
                }}
              >
                <div className="not-sr-only w-7 h-7 rounded-full overflow-hidden grid items-stretch justify-items-stretch relative group">
                  {item.visible && (
                    <>
                      {item.type === "Equation" && <Equation.Icon obj={item} />}
                      {item.type === "Expression" && (
                        <Expression.Icon obj={item} />
                      )}
                      {item.type === "Table" && <Table.Icon obj={item} />}
                      {item.type === "Vector Field" && (
                        <VectorField.Icon obj={item} />
                      )}
                    </>
                  )}
                  <div
                    className={classNames(
                      "absolute inset-0 w-full h-full rounded-full",
                      {
                        "hover:bg-gray-700/10": !item.visible,
                        "hover:bg-gray-700/20": item.visible,
                      }
                    )}
                    style={{
                      boxShadow: !item.visible
                        ? "inset 0 0 3px 1px rgba(0, 0, 0, 0.3)"
                        : undefined,
                    }}
                  />
                </div>
                <span className="sr-only">Change color</span>
              </button>
            </div>
            <div className="flex-grow grid grid-rows-1 grid-cols-1 justify-items-stretch">
              {item.type === "Equation" && (
                <Equation.ContentEditor
                  obj={item}
                  setObj={(newObj) => setItem(item, { ...item, ...newObj })}
                />
              )}
              {item.type === "Expression" && (
                <Expression.ContentEditor
                  obj={item}
                  setObj={(newObj) => setItem(item, { ...item, ...newObj })}
                />
              )}
              {item.type === "Table" && (
                <Table.ContentEditor
                  obj={item}
                  setObj={(newObj) => setItem(item, { ...item, ...newObj })}
                />
              )}
              {item.type === "Vector Field" && (
                <VectorField.ContentEditor
                  obj={item}
                  setObj={(newObj) => setItem(item, { ...item, ...newObj })}
                />
              )}
            </div>
            <button
              onClick={() => deleteItem(index)}
              className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
            >
              <span className="sr-only">Delete</span>
              <span className="not-sr-only text-xs text-gray-600 dark:text-gray-300">
                X
              </span>
            </button>
          </div>
        ))}
        <div className="mt-auto space-y-1 mb-2">
          {variables.map(([name, value], index) => (
            <div key={name} className="flex items-center space-x-2 px-2">
              <span>{name}:</span>
              <input
                className="flex-grow"
                type="range"
                min={-5}
                max={5}
                step={0.001}
                value={value}
                onChange={(event) => {
                  const newValue = event.target.valueAsNumber;
                  setVariables((variables) => {
                    const newVariables = [...variables];
                    newVariables[index][1] = newValue;
                    return newVariables;
                  });
                }}
              />
              <span className="w-12">{value}</span>
              <button
                className="bg-gray-100 border rounded px-1 py-px text-sm"
                onClick={() => {
                  setVariables((variables) => {
                    const newVariables = [...variables];
                    newVariables.splice(index, 1);
                    return newVariables;
                  });
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden">
        <Graph3D varValues={Object.fromEntries(variables)}>
          {({ dimension }) => {
            return (
              <>
                <GraphGrid3D normalAxis="z" />
                <GraphAxis3D axis="x" />
                <GraphAxis3D axis="y" />
                <GraphAxis3D axis="z" />
                <GraphBoundingBox3D />
                {items.map(
                  (item) =>
                    item.visible && (
                      <Fragment key={item.id}>
                        {item.type === "Expression" && (
                          <Expression.Output obj={item} />
                        )}
                        {item.type === "Equation" && (
                          <Equation.Output obj={item} />
                        )}
                        {item.type === "Table" && <Table.Output obj={item} />}
                        {item.type === "Vector Field" && (
                          <VectorField.Output obj={item} />
                        )}
                      </Fragment>
                    )
                )}
                {slices.map((slice) => (
                  <Area
                    key={slice.id}
                    shape={sliceShape}
                    color="black"
                    axes={
                      ["x", "y", "z"].filter(
                        (axis) => axis !== slice.axisVar
                      ) as [Axis, Axis]
                    }
                    normalAxisPosition={slice.value}
                  />
                ))}
              </>
            );
          }}
        </Graph3D>

        {slices.length > 0 && (
          <div className="absolute bottom-0 right-0 flex space-x-4 p-4">
            {slices.map(({ id, axisVar, value }) => (
              <div
                key={id}
                className="bg-gray-900 dark:bg-black p-2 space-y-2 rounded-xl relative"
              >
                <div className="relative w-48 h-48 bg-white rounded overflow-hidden">
                  <button
                    className="bg-gray-800 text-white absolute top-1 right-1 z-10 rounded w-6 h-6 flex items-center justify-center"
                    onClick={() => {
                      setSlices((slices) =>
                        slices.filter((slice) => slice.id !== id)
                      );
                    }}
                  >
                    X
                  </button>
                  <Graph3D
                    defaultDimension="2D"
                    showControls={false}
                    allowPan={false}
                  >
                    {() => {
                      const axes = (["x", "y", "z"] as Axis[]).filter(
                        (axis) => axis !== axisVar
                      );

                      return (
                        <>
                          <GraphAxis3D axis="x" label={axes[0]} />
                          <GraphAxis3D axis="y" label={axes[1]} />
                          <GraphGrid3D />
                          {items.map((item) => (
                            <Fragment key={item.id}>
                              {item.type === "Equation" && (
                                <GraphEquation3D
                                  axes={axes}
                                  equation={item.latex}
                                  color={item.color}
                                  varValues={{
                                    [axisVar]: value,
                                  }}
                                />
                              )}
                            </Fragment>
                          ))}
                        </>
                      );
                    }}
                  </Graph3D>
                </div>
                <div
                  className="text-white flex text-2xl px-2"
                  style={{ fontFamily: "CMU Serif" }}
                >
                  <select
                    className="italic bg-transparent pr-2"
                    value={axisVar}
                    onChange={(event) =>
                      setSlices((slices) =>
                        slices.map((slice) =>
                          slice.id === id
                            ? { ...slice, axisVar: event.target.value }
                            : slice
                        )
                      )
                    }
                  >
                    <option value="x">x</option>
                    <option value="y">y</option>
                    <option value="z">z</option>
                  </select>
                  <span className="mx-2"> = </span>
                  <input
                    className="bg-transparent flex-grow flex-shrink w-0"
                    type="number"
                    value={value}
                    onChange={(event) =>
                      setSlices((slices) =>
                        slices.map((slice) =>
                          slice.id === id
                            ? { ...slice, value: event.target.valueAsNumber }
                            : slice
                        )
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getOptimalItemType(
  mathJSON: BoxedExpression
): "equation" | "expression" | "vector" {
  const json = mathJSON.json;

  if (Array.isArray(json)) {
    if (
      [
        "Less",
        "LessEqual",
        "Equal",
        "GreaterEqual",
        "Greater",
        "NotEqual",
      ].includes(json[0] as string)
    ) {
      return "equation";
    }
  }

  return "expression";
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
        wrapperDivClassName="block text-2xl w-full flex-grow self-stretch focus-within:outline"
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

interface VectorInputProps {
  expressions: string[];
  setExpressions: (expressions: string[]) => void;
  color: "red" | "blue";
  setColor: (color: "red" | "blue") => void;
  showParticles: boolean;
  setShowParticles: (showParticles: boolean) => void;
  deleteSelf: () => void;
}

function VectorInput({
  expressions,
  setExpressions,
  color,
  setColor,
  showParticles,
  setShowParticles,
  deleteSelf,
}: VectorInputProps) {
  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 p-2 flex flex-col justify-center space-y-1">
        <button
          onClick={() => setColor(color === "red" ? "blue" : "red")}
          className={classNames("block w-6 h-6 rounded-full", {
            "bg-red-600": color === "red",
            "bg-blue-600": color === "blue",
          })}
        >
          <span className="sr-only">Change color</span>
        </button>
        <input
          type="checkbox"
          checked={showParticles}
          onChange={(event) => setShowParticles(event.target.checked)}
        />
      </div>
      <div className="text-2xl flex items-center select-none">
        <span>〈</span>
        <Join separator={<span>, </span>}>
          {expressions.map((expression, i) => (
            <MathLiveInput
              key={i}
              latex={expression}
              onChange={(latex) => {
                setExpressions(
                  expressions.map((e, j) => (i === j ? latex : e))
                );
              }}
              options={{}}
              wrapperDivClassName="block text-2xl w-full flex-grow self-center focus-within:outline"
              className="py-4 outline-none"
              style={
                color === "red"
                  ? "--hue: 0; --selection-background-color-focused: rgb(220 38 38 / 0.2); --selection-color-focused: rgb(127 29 29 / 1);"
                  : color === "blue"
                  ? "--hue: 222; --selection-background-color-focused: rgb(37 99 235 / 0.2); --selection-color-focused: rgb(30 58 138 / 1);"
                  : undefined
              }
            />
          ))}
        </Join>
        <span>〉</span>
      </div>
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

interface JoinProps {
  children: ReactNode;
  separator: ReactNode;
}

function Join({ children, separator }: JoinProps) {
  return (
    <>
      {Children.toArray(children)
        .filter((child) => child)
        .flatMap(
          (child, i) =>
            [
              child,
              i < Children.count(children) - 1 && (
                <Fragment key={`separator-${i}`}>{separator}</Fragment>
              ),
            ] as const
        )}
    </>
  );
}
