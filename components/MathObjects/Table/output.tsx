"use client";

import { Vector3 } from "three";
import { Point } from "../../Graph3D/display/Point";
import type { ObjectDescription } from "./spec";

interface OutputProps {
  obj: ObjectDescription;
}

export function Output({ obj }: OutputProps) {
  return (
    <>
      {obj.values.map((point, index) => (
        <Point key={index} point={new Vector3(...point)} />
      ))}
    </>
  );
}
