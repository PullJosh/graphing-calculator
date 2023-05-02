export const spec = {
  name: "Action",
  description: "An action that assigns a value to a variable",
  props: [
    {
      name: "variable",
      type: "string",
      description: "The variable to assign the value to",
      required: true,
    },
    {
      name: "latex",
      type: "latex",
      description: "The LaTeX representation of the exprsesion",
      required: true,
    },
  ],
} as const;

export type ObjectDescription = {
  type: typeof spec.name;
  variable: string;
  latex: string;
};

export const defaultProps: ObjectDescription = {
  type: spec.name,
  variable: "a",
  latex: "a + 1",
} as const;
