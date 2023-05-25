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
        "bg-red-600": false, // obj.color === "red",
        "bg-blue-600": true, // obj.color === "blue",
      })}
    ></svg>
  );
}
