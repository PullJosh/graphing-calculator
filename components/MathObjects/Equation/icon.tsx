"use client";

import classNames from "classnames";

import { ObjectDescription } from "./spec";

interface IconProps {
  obj: ObjectDescription;
}

export function Icon({ obj }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={classNames({
        "bg-red-600": obj.color === "red",
        "bg-blue-600": obj.color === "blue",
      })}
    >
      <path
        d="M 0 28 C 4.666 4, 9.333 4, 14 14 S 23.333 24, 28 0"
        className="stroke-red-100"
        strokeWidth={2}
        fill="transparent"
      />
    </svg>
  );
}
