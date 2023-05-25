"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Graph3D } from "../../../components/Graph3D/Graph3D";
import { GraphAxis3D } from "../../../components/Graph3D/GraphAxis3D";
import { ComputeEngine } from "@cortex-js/compute-engine";

const MathLiveInput = dynamic(
  () =>
    import("../../../components/MathLiveInput").then(
      (mod) => mod.MathLiveInput
    ),
  { ssr: false }
);

const ce = new ComputeEngine();

export default function ComplexSequence() {
  const [latex, setLatex] = useState(String.raw`\frac{i}{n}`);
  const mathJSON = useMemo(() => ce.parse(latex), [latex]);

  const evaluatedPoints = useMemo(() => {
    let points = [];
    for (let n = 1; n <= 100; n++) {
      const result = mathJSON.subs({ n }).N().json;
      if (typeof result === "number") {
        points.push([result, 0]);
      } else if (Array.isArray(result) && result[0] === "Complex") {
        points.push([result[1], result[2]]);
      } else {
        console.warn("Invalid result: ", result, "for n = ", n);
      }
    }
    return points;
  }, [mathJSON]);

  console.log(evaluatedPoints);

  return (
    <div className="container mx-auto px-16">
      <div className="prose">
        <h1>Complex Sequence Visualizer</h1>
        <MathLiveInput
          latex={latex}
          onChange={(newLatex) => setLatex(newLatex)}
        />
        <div className="w-[600px] h-[600px] relative">
          <Graph3D view="2D">
            {() => (
              <>
                <GraphAxis3D axis="x" />
                <GraphAxis3D axis="y" />
                {/* {evaluatedPoints.map(([re, im], n) => (
                  <GraphPoint3D key={n} x={re} y={im} z={0} />
                ))} */}
              </>
            )}
          </Graph3D>
        </div>
      </div>
    </div>
  );
}
