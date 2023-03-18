export const spec = {
  name: "Vector Field",
  description: "A field of vectors",
  props: [
    {
      name: "components",
      type: "array",
      item: { type: "latex" },
      description: "The components of the vector",
      required: true,
    },
  ],
} as const;

export type ObjectDescription = {
  type: typeof spec.name;
  components: readonly string[];
};

export const defaultProps: ObjectDescription = {
  type: spec.name,
  components: ["y", "-x"],
} as const;
