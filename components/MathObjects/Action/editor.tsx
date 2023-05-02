import dynamic from "next/dynamic";
import type { ObjectDescription } from "./spec";
import { ContentEditorProps } from "..";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { useCallback, useEffect, useState } from "react";
const ce = new ComputeEngine();

const MathLiveInput = dynamic(
  () => import("../../MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

export function ContentEditor({
  obj,
  setObj,
  variables,
  setVariables,
}: ContentEditorProps<ObjectDescription>) {
  const { variable, latex } = obj;

  const setVariable = (newVariable: string) => {
    setObj({ ...obj, variable: newVariable });
  };

  const setLatex = (newLatex: string) => {
    setObj({ ...obj, latex: newLatex });
  };

  const action = useCallback(() => {
    setVariables(
      variables.map(([name, value]) => {
        if (name === variable) {
          try {
            ce.pushScope(Object.fromEntries(variables) as any);
            let newValue = Number(ce.parse(latex).N().valueOf() ?? 0);
            if (isNaN(newValue)) newValue = 0;
            console.log(newValue);
            ce.popScope();
            return [name, newValue];
          } catch (err) {
            console.error(err);
            return [name, value];
          }
        } else {
          return [name, value];
        }
      })
    );
  }, [variable, latex, variables, setVariables]);

  const [running, setRunning] = useState(false);

  useEffect(() => {
    let done = false;

    function loop() {
      action();
      if (!done) requestAnimationFrame(loop);
    }

    if (running) {
      loop();
      return () => {
        done = true;
      };
    }
  }, [action, running]);

  return (
    <div>
      Set{" "}
      <select
        value={variable}
        onChange={(event) => {
          setVariable(event.target.value);
          setRunning(false);
        }}
      >
        <option value="">---</option>
        {variables.map(([name, value]) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>{" "}
      to
      <MathLiveInput
        latex={latex}
        onChange={(newLatex) => {
          setLatex(newLatex);
          setRunning(false);
        }}
        wrapperDivClassName="block text-2xl w-full flex-grow self-center focus-within:outline dark:bg-gray-700 dark:text-gray-100"
        className="w-full px-3 py-4 outline-none"
      />
      <div className="bg-gray-100 space-x-2 p-2">
        <button
          className="border rounded px-1 py-px"
          onClick={() => setRunning(!running)}
        >
          {running ? "◼️ Stop" : "▶ Play"}
        </button>
        <button
          className="border rounded px-1 py-px"
          onClick={() => action()}
          disabled={running}
        >
          ↦ Run once
        </button>
      </div>
    </div>
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
