import { BoxedExpression } from "@cortex-js/compute-engine";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Box, Contour, Point } from "../lib";
import { GraphContext } from "./Graph";
import { GraphContours } from "./GraphContours";

import type { graph_equation_to_contours_json } from "joshs_graphing_calculator_lib";
import { Remote, wrap } from "comlink";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { API } from "../workers/graphEquation.worker";
const ce = new ComputeEngine();

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
  depth?: bigint;
  searchDepth?: bigint;
}

export function GraphEquation({
  equation,
  color,
  depth = 7n,
  searchDepth = 3n,
}: GraphEquationProps) {
  const { graphWindow } = useContext(GraphContext)!;

  const mathJSON = useMemo(() => ce.parse(equation), [equation]);
  let contours = useContoursForEquation(
    mathJSON,
    graphWindow,
    depth,
    searchDepth
  );

  return <GraphContours contours={contours} color={color} />;
}

const api: Remote<API> = wrap(
  new Worker(new URL("../workers/graphEquation.worker.ts", import.meta.url))
);

function useContoursForEquation(
  equation: BoxedExpression,
  desiredWindow: Box,
  depth = 7n,
  searchDepth = 3n
) {
  const busy = useRef(false);
  const [contours, setContours] = useState<Point[][]>([]);

  useEffect(() => {
    if (busy.current) return;

    console.log("Setting busy to true...");
    busy.current = true;
    (async function () {
      try {
        const regions = getOptimalRegions(desiredWindow);
        const promise = api.graphAllRegionsToContours(
          JSON.stringify(equation),
          regions,
          depth,
          searchDepth
        );
        console.log("Promise:", promise);
        const contours = await promise;
        setContours(contours);
      } catch (err) {
        console.error(err);
        setContours([]);
      } finally {
        console.log("Setting busy to false...");
        busy.current = false;
      }
    })();
  }, [busy, desiredWindow, equation, depth, searchDepth]);

  return contours;
}

function getOptimalRegions(coverWindow: Box) {
  const maxDim = Math.max(
    coverWindow.maxX - coverWindow.minX,
    coverWindow.maxY - coverWindow.minY
  );
  const scale = Math.ceil(Math.log2(maxDim)) - 1;
  const minX = Math.floor(coverWindow.minX / 2 ** scale);
  const maxX = Math.ceil(coverWindow.maxX / 2 ** scale);
  const minY = Math.floor(coverWindow.minY / 2 ** scale);
  const maxY = Math.ceil(coverWindow.maxY / 2 ** scale);

  let regions = [];
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      regions.push([scale, x, y]);
    }
  }
  return regions;
}
