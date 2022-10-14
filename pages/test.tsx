import { useContext, useMemo, useState } from "react";
import {
  Graph,
  GraphContext,
  GraphLayer,
  useCoordinateTransformations,
} from "../components/Graph";
import { GraphContours } from "../components/GraphContours";
import { GraphEquation } from "../components/GraphEquation";
import { Contour } from "../lib";

import { test } from "joshs-graphing-calculator-lib";

import { ComputeEngine } from "@cortex-js/compute-engine";

import { MathQuillInput } from "../components/MathQuillInput";

const ce = new ComputeEngine();

interface GraphedEquation {
  graph_box: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
  quad_tree: any;
  contours: Contour[];
}

export default function Test() {
  const [latex, setLatex] = useState(String.raw`y=\left|x\right|`);

  const mathJSON = useMemo(() => ce.parse(latex), [latex]);

  let result: GraphedEquation | null = null;
  try {
    result = JSON.parse(test(JSON.stringify(mathJSON)));
  } catch {}

  return (
    <>
      <MathQuillInput
        defaultValue={latex}
        onChange={(newValue) => setLatex(newValue)}
      />
      <pre>{latex}</pre>
      <pre>{JSON.stringify(mathJSON)}</pre>
      {result && (
        <>
          <Graph>
            {/* <GraphEquation equation="x*y=1" color="red" /> */}
            <GraphTree
              quad_tree={result.quad_tree}
              graph_box={result.graph_box}
            />
            <GraphContours
              contours={result.contours.map((contour) => contour.points)}
              color="blue"
            />
          </Graph>
          <div style={{ fontFamily: "monospace", fontSize: 10 }}>
            {JSON.stringify(result.contours)}
          </div>
        </>
      )}
    </>
  );
}

function GraphTree({
  quad_tree,
  graph_box,
}: {
  quad_tree: any;
  graph_box: GraphedEquation["graph_box"];
}) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <GraphTreeSquare node={quad_tree} box={graph_box} />
      </svg>
    </GraphLayer>
  );
}

interface GraphTreeSquareProps {
  node: any;
  box: GraphedEquation["graph_box"];
}

function GraphTreeSquare({ node, box }: GraphTreeSquareProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos, toGraphPos } = useCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  if (typeof node === "string") {
    const minPos = toScreenPos([box.x_min, box.y_min]);
    const maxPos = toScreenPos([box.x_max, box.y_max]);

    return (
      <rect
        x={minPos[0]}
        y={maxPos[1]}
        width={Math.abs(maxPos[0] - minPos[0])}
        height={Math.abs(maxPos[1] - minPos[1])}
        fill={{ Negative: "#f004", Positive: "#0f04", Zero: "#00f4" }[node]}
        stroke={{ Negative: "#f00", Positive: "#0f0", Zero: "#00f" }[node]}
        strokeWidth={1}
      />
    );
  }

  if ("Root" in node) {
    return (
      <>
        <GraphTreeSquare
          node={node.Root.children[0]}
          box={{
            x_min: box.x_min,
            x_max: (box.x_min + box.x_max) / 2,
            y_min: box.y_min,
            y_max: (box.y_min + box.y_max) / 2,
          }}
        />
        <GraphTreeSquare
          node={node.Root.children[1]}
          box={{
            x_min: (box.x_min + box.x_max) / 2,
            x_max: box.x_max,
            y_min: box.y_min,
            y_max: (box.y_min + box.y_max) / 2,
          }}
        />
        <GraphTreeSquare
          node={node.Root.children[2]}
          box={{
            x_min: box.x_min,
            x_max: (box.x_min + box.x_max) / 2,
            y_min: (box.y_min + box.y_max) / 2,
            y_max: box.y_max,
          }}
        />
        <GraphTreeSquare
          node={node.Root.children[3]}
          box={{
            x_min: (box.x_min + box.x_max) / 2,
            x_max: box.x_max,
            y_min: (box.y_min + box.y_max) / 2,
            y_max: box.y_max,
          }}
        />
      </>
    );
  }

  if ("Leaf" in node) {
    const pos = toScreenPos(node.Leaf.vertex);

    return (
      <circle cx={pos[0]} cy={pos[1]} r={3} fill="lightblue" stroke="none" />
    );
  }

  return null;
}
