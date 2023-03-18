import dynamic from "next/dynamic";
import { Children, Fragment, ReactNode } from "react";
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
  const { components } = obj;

  const setComponents = (newComponents: string[]) => {
    setObj({ ...obj, components: newComponents });
  };

  const setComponent = (index: number, newComponent: string) => {
    setComponents([
      ...components.slice(0, index),
      newComponent,
      ...components.slice(index + 1),
    ]);
  };

  return (
    <div className="flex items-center">
      <span>〈</span>
      <Join separator={<span>, </span>}>
        {components.map((component, i) => (
          <MathLiveInput
            key={i}
            latex={component}
            onChange={(newLatex) => {
              setComponent(i, newLatex);
            }}
            options={{}}
            wrapperDivClassName="block text-2xl self-center focus-within:outline dark:bg-gray-700 dark:text-gray-100"
            className="px-0 py-4 outline-none"
          />
        ))}
      </Join>
      <span>〉</span>
    </div>
  );
}

interface SettingsEditorProps {
  obj: ObjectDescription;
  setObj: (obj: ObjectDescription) => void;
}

export function SettingsEditor({ obj, setObj }: SettingsEditorProps) {
  return <></>;
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
