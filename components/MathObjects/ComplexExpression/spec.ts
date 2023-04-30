export const spec = {
  name: "Complex Expression",
  description:
    "An expression that takes a complex number z as input and gives a complex number as output",
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
  latex: "z",
} as const;
