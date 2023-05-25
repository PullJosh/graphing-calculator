"use client";

import { GraphEquation3D } from "../../Graph3D/GraphEquation3D";
import type { ObjectDescription } from "./spec";

interface OutputProps {
  obj: ObjectDescription;
}

export function Output({ obj }: OutputProps) {
  return <GraphEquation3D equation={obj.latex} color={obj.color} />;
}
