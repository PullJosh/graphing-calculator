import dynamic from "next/dynamic";
import type { ObjectDescription } from "./spec";
import { ContentEditorProps } from "..";

const MathLiveInput = dynamic(
  () => import("../../MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

export function ContentEditor({
  obj,
  setObj,
}: ContentEditorProps<ObjectDescription>) {
  const { latex } = obj;

  const setLatex = (newLatex: string) => {
    setObj({ ...obj, latex: newLatex });
  };

  return (
    <MathLiveInput
      latex={latex}
      onChange={(newLatex) => {
        setLatex(newLatex);
      }}
      wrapperDivClassName="block text-2xl w-full flex-grow self-center focus-within:outline dark:bg-gray-700 dark:text-gray-100"
      className="w-full px-3 py-4 outline-none"
    />
  );
}

interface SettingsEditorProps {
  obj: ObjectDescription;
  setObj: (obj: ObjectDescription) => void;
}

export function SettingsEditor({ obj, setObj }: SettingsEditorProps) {
  return <></>;
}
