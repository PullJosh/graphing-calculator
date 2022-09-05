import { useRef, useState } from "react";
import { Graph, GraphEquation, GraphGrid } from "../components/Graph";
import classNames from "classnames";
import useSize from "@react-hook/size";

interface EquationItem {
  id: number;
  equation: string;
  color: "red" | "blue";
}

export default function Index() {
  const [items, setItems] = useState<EquationItem[]>([
    { id: 0, equation: "y=x^2", color: "red" },
    { id: 1, equation: "x^2+y^2=25", color: "blue" },
  ]);

  const setItem = (index: number, item: EquationItem) => {
    setItems((items) => [
      ...items.slice(0, index),
      item,
      ...items.slice(index + 1),
    ]);
  };

  const setEquation = (index: number, equation: string) => {
    setItem(index, { ...items[index], equation });
  };

  const setColor = (index: number, color: "red" | "blue") => {
    setItem(index, { ...items[index], color });
  };

  const insertItem = (
    index = items.length,
    equation = "y=x",
    color: "red" | "blue" = "red"
  ) => {
    setItems((items) => [
      ...items.slice(0, index + 1),
      {
        id: Math.max(...items.map((item) => item.id)) + 1,
        equation,
        color,
      },
      ...items.slice(index + 1),
    ]);
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
          <EquationInput
            key={item.id}
            equation={item.equation}
            setEquation={(newEquation) => setEquation(index, newEquation)}
            color={item.color}
            setColor={(newColor) => setColor(index, newColor)}
            deleteSelf={() => deleteItem(index)}
          />
        ))}
        <div className="flex mt-4 justify-center">
          <button
            onClick={() => insertItem()}
            disabled={items.length >= 4}
            className="bg-gray-100 border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add equation
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
          <GraphGrid xStep={1} yStep={1} />
          {items.map((item) => (
            <GraphEquation
              key={item.id}
              equation={item.equation}
              color={item.color}
              debug={debug}
            />
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
      <input
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
