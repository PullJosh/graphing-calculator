"use client";

import { Fragment, useContext, useMemo } from "react";
import { Graph3DContext } from "./Graph3D";
import { GraphGridLine3D } from "./GraphGridLine3D";
import { Vector3 } from "three";
import { GraphText3D } from "./GraphText3D";

interface GraphGrid3DProps {
  normalAxis?: "x" | "y" | "z";
}

export function GraphGrid3D({ normalAxis = "z" }: GraphGrid3DProps) {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;

  const scale = new Vector3(
    getBestScale(window[0][0], window[1][0]),
    getBestScale(window[0][1], window[1][1]),
    getBestScale(window[0][2], window[1][2])
  );

  const { axisComponentCounts, toSceneX, toSceneY, toSceneZ } = viewInfo;

  const gridXValues = useMemo(() => {
    let gridXValues = new Set<number>();
    gridXValues.add(window[0][0]);
    for (
      let x = (Math.floor(window[0][0] / scale.x) + 1) * scale.x;
      x < window[1][0];
      x += scale.x
    ) {
      gridXValues.add(x);
    }
    gridXValues.add(window[1][0]);
    if (axisComponentCounts.y > 0 || axisComponentCounts.z > 0) {
      gridXValues.delete(0);
    }
    return [...gridXValues];
  }, [window, axisComponentCounts, scale.x]);

  const gridYValues = useMemo(() => {
    let gridYValues = new Set<number>();
    gridYValues.add(window[0][1]);
    for (
      let y = (Math.floor(window[0][1] / scale.y) + 1) * scale.y;
      y < window[1][1];
      y += scale.y
    ) {
      gridYValues.add(y);
    }
    gridYValues.add(window[1][1]);
    if (axisComponentCounts.x > 0 || axisComponentCounts.z > 0) {
      gridYValues.delete(0);
    }
    return [...gridYValues];
  }, [window, axisComponentCounts, scale.y]);

  const gridZValues = useMemo(() => {
    let gridZValues = new Set<number>();
    gridZValues.add(window[0][2]);
    for (
      let z = (Math.floor(window[0][2] / scale.z) + 1) * scale.z;
      z < window[1][2];
      z += scale.z
    ) {
      gridZValues.add(z);
    }
    gridZValues.add(window[1][2]);
    if (axisComponentCounts.x > 0 || axisComponentCounts.y > 0) {
      gridZValues.delete(0);
    }
    return [...gridZValues];
  }, [window, axisComponentCounts, scale.z]);

  if (normalAxis === "x") {
    return (
      <>
        {gridYValues.map((y) => (
          <GraphGridLine3D key={`y-${y},z`} x={0} y={y} z={null} />
        ))}
        {gridZValues.map((z) => (
          <GraphGridLine3D key={`z-${z},y`} x={0} y={null} z={z} />
        ))}
      </>
    );
  }

  if (normalAxis === "y") {
    return (
      <>
        {gridXValues.map((x) => (
          <GraphGridLine3D key={`x-${x},z`} x={x} y={0} z={null} />
        ))}
        {gridZValues.map((z) => (
          <GraphGridLine3D key={`z-${z},x`} x={null} y={0} z={z} />
        ))}
      </>
    );
  }

  if (normalAxis === "z") {
    return (
      <>
        {gridXValues.map((x, index) => (
          <Fragment key={`x-${x},y`}>
            <GraphGridLine3D x={x} y={null} z={0} />
            {index > 0 && index < gridXValues.length - 1 && (
              <GraphText3D
                position={new Vector3(toSceneX(x), toSceneZ(0), -toSceneY(0))}
                font="sans-serif"
                fontSize={0.08}
              >
                {x.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </GraphText3D>
            )}
          </Fragment>
        ))}
        {gridYValues.map((y) => (
          <GraphGridLine3D key={`y-${y},x`} x={null} y={y} z={0} />
        ))}
        <GraphText3D
          position={new Vector3(toSceneX(0), toSceneZ(0), -toSceneY(0))}
          font="sans-serif"
        >
          0
        </GraphText3D>
      </>
    );
  }

  return null;
}

function getBestScale(min: number, max: number, desiredGridLineCount = 10) {
  const range = max - min;

  // Grid lines can be multiples of 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, etc.
  // We want to find the best power of 10 to use as a scale.

  const desiredScale = range / desiredGridLineCount;

  const powerSmall = Math.pow(10, Math.floor(Math.log10(desiredScale)));
  const powerLarge = Math.pow(10, Math.ceil(Math.log10(desiredScale)));

  const scaleOptions = [
    powerSmall,
    powerSmall * 2,
    powerSmall * 5,
    powerLarge,
    powerLarge * 2,
    powerLarge * 5,
  ];

  const errors = scaleOptions.map((scale) => Math.abs(scale - desiredScale));

  const scale = scaleOptions[errors.indexOf(Math.min(...errors))];

  return scale;
}
