"use client";

import { Graph3D } from "../../../components/Graph3D/Graph3D";

import { useState } from "react";
import { GraphAxis3D } from "../../../components/Graph3D/GraphAxis3D";
import dynamic from "next/dynamic";
import { GraphComplexExpression3D } from "../../../components/Graph3D/GraphComplexExpression3D";

const MathQuillInput = dynamic(
  () =>
    import("../../../components/MathQuillInput").then(
      (mod) => mod.MathQuillInput
    ),
  { ssr: false }
);

export default function ComplexDomainColoringImageGenerator() {
  const [latex, setLatex] = useState("sin(z)");
  const [showAxes, setShowAxes] = useState(true);

  return (
    <div className="container mx-auto px-16">
      <div className="prose">
        <h1>Domain Coloring Image Generator (Complex Expressions)</h1>

        <div className="w-[600px] h-[600px] relative">
          <div className="absolute z-50 bottom-0 left-0 bg-white text-3xl px-8 py-3">
            <MathQuillInput
              latex={latex}
              onChange={(newLatex) => setLatex(newLatex)}
            />
          </div>
          <Graph3D view="2D">
            {() => (
              <>
                {showAxes && (
                  <>
                    <GraphAxis3D axis="x" />
                    <GraphAxis3D axis="y" />
                  </>
                )}
                <GraphComplexExpression3D expression={latex} />
              </>
            )}
          </Graph3D>
        </div>

        <label>
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(event) => setShowAxes(event.target.checked)}
          />{" "}
          <span>Show axes</span>
        </label>
      </div>
    </div>
  );
}
