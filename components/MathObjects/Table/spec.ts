export const spec = {
  name: "Table",
  description: "A table of points",
  props: [
    {
      name: "values",
      type: "array",
      item: {
        type: "array",
        item: { type: "number" },
      },
      description: "The values of the table cells",
      required: true,
    },
  ],
} as const;

export type ObjectDescription = {
  type: typeof spec.name;
  values: readonly (readonly number[])[];
};

export const defaultProps: ObjectDescription = {
  type: spec.name,
  values: [[1, 2, 3]],
} as const;
