export const spec = {
  name: "Expression",
  description: "An expression of variables to be graphed",
  props: [
    {
      name: "latex",
      type: "latex",
      description: "The LaTeX representation of the expression",
      required: true,
    },
  ],
} as const;

export type ObjectDescription = {
  type: typeof spec.name;
  latex: string;
};

export const defaultProps: ObjectDescription = {
  type: spec.name,
  latex: "x+y",
} as const;
