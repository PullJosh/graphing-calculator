"use client";

import { useContext } from "react";
import { Graph3DContext } from "../../Graph3D/Graph3D";
import { GraphVectorField3D } from "../../Graph3D/GraphVectorField3D";
import type { ObjectDescription } from "./spec";

interface OutputProps {
  obj: ObjectDescription;
}

export function Output({ obj }: OutputProps) {
  const { dimension } = useContext(Graph3DContext);

  return (
    <GraphVectorField3D
      expressions={obj.components as string[]}
      step={dimension.value === "3D" ? 2 : 1}
      color="red"
      showAsCone={dimension.value === "3D"}
      showParticles={false}
    />
  );
}
