import dynamic from "next/dynamic";
import type { ObjectDescription } from "./spec";
import { ContentEditorProps } from "..";

const MathQuillInput = dynamic(
  () => import("../../MathQuillInput").then((mod) => mod.MathQuillInput),
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
    <MathQuillInput
      latex={latex}
      onChange={(newLatex) => {
        setLatex(newLatex);
      }}
      className="px-4 py-2 text-2xl !flex items-center focus-within:outline dark:bg-gray-700 dark:text-gray-100"
      fontSize="1.5rem"
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
