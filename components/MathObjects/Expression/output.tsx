"use client";

import { GraphExpression3D } from "../../Graph3D/GraphExpression3D";
import type { ObjectDescription } from "./spec";

interface OutputProps {
  obj: ObjectDescription;
}

export function Output({ obj }: OutputProps) {
  return <GraphExpression3D expression={obj.latex} />;
}
