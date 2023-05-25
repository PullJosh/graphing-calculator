"use client";

import { GraphComplexExpression3D } from "../../Graph3D/GraphComplexExpression3D";
import type { ObjectDescription } from "./spec";

interface OutputProps {
  obj: ObjectDescription;
}

export function Output({ obj }: OutputProps) {
  return <GraphComplexExpression3D expression={obj.latex} />;
}
