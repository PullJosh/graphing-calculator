import type { Dispatch, SetStateAction } from "react";

export * as Action from "./Action";
export * as ComplexExpression from "./ComplexExpression";
export * as Equation from "./Equation";
export * as Expression from "./Expression";
export * as Table from "./Table";
export * as VectorField from "./VectorField";

export interface ContentEditorProps<ObjectDescription> {
  obj: ObjectDescription;
  setObj: (obj: ObjectDescription) => void;

  variables: [string, number][];
  setVariables: Dispatch<SetStateAction<[string, number][]>>;
}
