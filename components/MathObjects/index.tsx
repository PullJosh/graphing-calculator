import { ReactElement, ReactNode } from "react";
import * as Equation from "./Equation";
import * as Expression from "./Expression";
import * as ComplexExpression from "./ComplexExpression";
import * as Table from "./Table";
import * as VectorField from "./VectorField";

export { Equation, Expression, ComplexExpression, Table, VectorField };

type MathObjectType<Settings> = {
  id: string;
  name: string;
  defaultSettings: Settings;
  Icon: (props: { settings: Settings }) => ReactElement;
  Output: (props: { settings: Settings }) => ReactElement;
  Editor: (props: {
    settings: Settings;
    setSettings: (newSettings: Settings) => void;
  }) => ReactNode;
};

interface EquationSettings {
  color: string;
  latex: string;
}

const EquationType: MathObjectType<EquationSettings> = {
  id: "0",
  name: "Equation",
  defaultSettings: {
    color: "red",
    latex: "y = x",
  },
  Editor({ settings, setSettings }) {
    return <div>{settings.latex}</div>;
  },
  Icon({ settings }) {
    return <div className="bg-red-600" />;
  },
  Output({ settings }) {
    return <text>{settings.latex}</text>;
  },
};

// type MathObject<T extends MathObjectType<any>> = {
//   id: string;
//   type: T;
//   settings: T extends MathObjectType<infer Settings> ? Settings : never;
// };

const uid = (() => {
  let id = 0;
  return () => id++;
})();

class MathObject<Settings> {
  id: number;
  type: MathObjectType<Settings>;
  settings: Settings;

  constructor(type: MathObjectType<Settings>, settings?: Settings) {
    if (!settings) {
      settings = type.defaultSettings;
    }

    this.id = uid();
    this.type = type;
    this.settings = settings;
  }
}

// Need to use <any> here because in the future these could be loaded as plugins (so exact
// list of MathObjectTypes not known at build time) and we need to be typesafe regardless
const objectTypes: MathObjectType<any>[] = [EquationType];

const objects = [
  new MathObject(EquationType, {
    latex: "y=x",
    color: "red",
  }),
];

const object = objects[0];
