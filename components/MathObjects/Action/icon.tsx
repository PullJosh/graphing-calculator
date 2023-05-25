"use client";

import { ObjectDescription } from "./spec";

interface IconProps {
  obj: ObjectDescription;
}

export function Icon({ obj }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" className="bg-gray-700">
      <path
        d="M 0 28 C 4.666 4, 9.333 4, 14 14 S 23.333 24, 28 0"
        className="stroke-red-100"
        strokeWidth={2}
        fill="transparent"
      />
    </svg>
  );
}
