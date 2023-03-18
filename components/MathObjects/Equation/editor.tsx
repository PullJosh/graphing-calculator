import classNames from "classnames";
import dynamic from "next/dynamic";
import type { ObjectDescription } from "./spec";

const MathLiveInput = dynamic(
  () => import("../../MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

interface ContentEditorProps {
  obj: ObjectDescription;
  setObj: (obj: ObjectDescription) => void;
}

export function ContentEditor({ obj, setObj }: ContentEditorProps) {
  const { color, latex } = obj;

  const setColor = (newColor: "red" | "blue") => {
    setObj({ ...obj, color: newColor });
  };

  const setLatex = (newLatex: string) => {
    setObj({ ...obj, latex: newLatex });
  };

  return (
    <>
      <MathLiveInput
        latex={latex}
        onChange={(newLatex) => {
          setLatex(newLatex);
        }}
        options={{}}
        wrapperDivClassName="block text-2xl w-full flex-grow self-center focus-within:outline dark:bg-gray-700 dark:text-gray-100"
        className="px-3 py-4 outline-none"
        style={
          color === "red"
            ? "--hue: 0; --selection-background-color-focused: rgb(220 38 38 / 0.2); --selection-color-focused: rgb(127 29 29 / 1);"
            : color === "blue"
            ? "--hue: 222; --selection-background-color-focused: rgb(37 99 235 / 0.2); --selection-color-focused: rgb(30 58 138 / 1);"
            : undefined
        }
        // onBlur={(mathJSON) => {
        //   console.log(mathJSON.json);
        //   getOptimalItemType(mathJSON);
        // }}
      />
      {/* <button
          onClick={() => deleteSelf()}
          className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
        >
          <span className="sr-only">Delete</span>
          <span className="not-sr-only text-xs text-gray-600 dark:text-gray-300">
            X
          </span>
        </button> */}
    </>
  );
}

interface SettingsEditorProps {
  obj: ObjectDescription;
  setObj: (obj: ObjectDescription) => void;
}

export function SettingsEditor({ obj, setObj }: SettingsEditorProps) {
  return (
    <>
      {/* <ColorPicker
        value={obj.color}
        onChange={(newColor) => setObj({ ...obj, color: newColor })}
      /> */}
    </>
  );
}
