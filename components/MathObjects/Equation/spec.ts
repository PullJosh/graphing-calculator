export const spec = {
  name: "Equation",
  description: "An equation or inequality",
  props: [
    {
      name: "latex",
      type: "latex",
      description: "The LaTeX representation of the equation",
      required: true,
    },
    {
      name: "color",
      type: "color",
      description: "The color of the equation in the graph",
      required: true,
      // allowDynamic: true, // Allow the color to depend on the graph axis variables (i.e. to be different in different places)
    },
  ],
} as const;

export type ObjectDescription = {
  type: typeof spec.name;
  latex: string;
  color: "red" | "blue";
};

export const defaultProps: ObjectDescription = {
  type: spec.name,
  latex: "y=x",
  color: "red", // TODO: Default to cycling through colors as new math objects are added
} as const;
