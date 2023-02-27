import { useContext, useMemo, useRef } from "react";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { Box3D, Color } from "../../types";
import { Graph3DContext } from "./Graph3D";
import { useVectorField } from "../../hooks/useVectorField";
import { Vector } from "./display/Vector";
import { Color as ThreeColor, Group, Line, Vector2 } from "three";
import { useWorldCoordinateTransformation } from "../../hooks/useWorldCoordinateTransformation";
import { extend, Object3DNode, useFrame, useThree } from "@react-three/fiber";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";
import { getColor } from "../../utils/tailwindColors";
const ce = new ComputeEngine();

extend({ LineMaterial, LineGeometry, Line2, Line_: Line });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    line2: Object3DNode<Line2, typeof Line2>;
    line_: Object3DNode<Line, typeof Line>;
  }
}

interface GraphVectorField3DInternalProps {
  expressions: string[];
  step?: number;
  color: Color | ThreeColor | "rainbow";
  varValues?: Record<string, number>;
  showHead?: boolean;
  showTail?: boolean;
  showAsCone?: boolean;
  showParticles?: boolean;
  // axes?: Axis[];
}

const lineCount = 1000;
const lineLength = 25;
const linePositions = new Float32Array(lineCount * lineLength * 3);
const lineColors = new Uint8Array(lineCount * lineLength * 4);

for (let i = 0; i < lineCount; i++) {
  let x = Math.random() * 10 - 5;
  let y = Math.random() * 10 - 5;
  let z = Math.random() * 10 - 5;

  for (let j = 0; j < lineLength; j += 1) {
    linePositions[i * lineLength * 3 + j * 3 + 0] = x;
    linePositions[i * lineLength * 3 + j * 3 + 1] = y;
    linePositions[i * lineLength * 3 + j * 3 + 2] = z;

    let dx = x * 0.04;
    let dy = y * 0.04;
    let dz = z * 0.04;

    x -= 0; // dx;
    y -= 0; // dy;
    z -= 0; // dz;

    const [r, g, b] = hsvToRgb(
      (Math.atan2(dy, dx) * (360 / (2 * Math.PI)) + 360) % 360,
      100,
      100
    );

    lineColors[i * lineLength * 4 + j * 4 + 0] = r;
    lineColors[i * lineLength * 4 + j * 4 + 1] = g;
    lineColors[i * lineLength * 4 + j * 4 + 2] = b;
    lineColors[i * lineLength * 4 + j * 4 + 3] = (j / lineLength) * 255;
  }
}

function hsvToRgb(h: number, s: number, v: number) {
  let r, g, b;
  let i;
  let f, p, q, t;

  // Make sure our arguments stay in-range
  h = Math.max(0, Math.min(360, h));
  s = Math.max(0, Math.min(100, s));
  v = Math.max(0, Math.min(100, v));

  // We accept saturation and value arguments from 0 to 100 because that's
  // how Photoshop represents those values. Internally, however, the
  // saturation and value are calculated from a range of 0 to 1. We make
  // That conversion here.
  s /= 100;
  v /= 100;

  if (s === 0) {
    // Achromatic (grey)
    r = g = b = v;
    return [r * 255, g * 255, b * 255];
  }

  h /= 60; // sector 0 to 5
  i = Math.floor(h);
  f = h - i; // factorial part of h
  p = v * (1 - s);
  q = v * (1 - s * f);
  t = v * (1 - s * (1 - f));

  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;

    case 1:
      r = q;
      g = v;
      b = p;
      break;

    case 2:
      r = p;
      g = v;
      b = t;
      break;

    case 3:
      r = p;
      g = q;
      b = v;
      break;

    case 4:
      r = t;
      g = p;
      b = v;
      break;

    default: // case 5:
      r = v;
      g = p;
      b = q;
  }

  return [r * 255, g * 255, b * 255];
}

const linePositionArrays: Float32Array[] = [];
const lineColorArrays: Uint8Array[] = [];
for (let i = 0; i < lineCount; i++) {
  linePositionArrays.push(
    linePositions.subarray(i * lineLength * 3, (i + 1) * lineLength * 3)
  );
  lineColorArrays.push(
    lineColors.subarray(i * lineLength * 4, (i + 1) * lineLength * 4)
  );
}

function updateLines(group?: Group) {
  // Shift arrays
  linePositions.set(linePositions.subarray(3), 0);
  lineColors.set(lineColors.subarray(4), 0);

  for (let i = 0; i < lineCount; i++) {
    let x = linePositions[(i + 1) * lineLength * 3 - 6];
    let y = linePositions[(i + 1) * lineLength * 3 - 5];
    let z = linePositions[(i + 1) * lineLength * 3 - 4];

    let dx = y * 0.04;
    let dy = -x * 0.04;
    let dz = 0;

    x += dx;
    y += dy;
    z += dz;

    const [r, g, b] = hsvToRgb(
      (Math.atan2(dy, dx) * (360 / (2 * Math.PI)) + 360) % 360,
      100,
      100
    );

    linePositions[(i + 1) * lineLength * 3 - 3] = x;
    linePositions[(i + 1) * lineLength * 3 - 2] = y;
    linePositions[(i + 1) * lineLength * 3 - 1] = z;

    lineColors[(i + 1) * lineLength * 4 - 4] = r;
    lineColors[(i + 1) * lineLength * 4 - 3] = g;
    lineColors[(i + 1) * lineLength * 4 - 2] = b;

    for (let j = 0; j < lineLength; j++) {
      lineColors[(i + 1) * lineLength * 4 + j * 4 + 3] =
        ((j + 1) / lineLength) * 255;
    }
  }

  if (group) {
    for (const child of group.children) {
      if (child instanceof Line) {
        child.geometry.attributes.position.needsUpdate = true;
        child.geometry.attributes.color.needsUpdate = true;
      }
    }
  }
}

export function GraphVectorField3DInternal({
  expressions,
  step = 1,
  color,
  varValues = {},
  showHead = true,
  showTail = false,
  showAsCone = false,
  showParticles = false,
}: GraphVectorField3DInternalProps) {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;

  const graphWindow: Box3D = useMemo(
    () => ({
      minX: window[0][0],
      maxX: window[1][0],
      minY: window[0][1],
      maxY: window[1][1],
      minZ: window[0][2],
      maxZ: window[1][2],
    }),
    [window]
  );

  const mathJSON = useMemo(
    () => expressions.map((expression) => ce.parse(expression)),
    [expressions]
  );

  const { origins, vectors, maxLength } = useVectorField(
    mathJSON,
    graphWindow,
    step,
    varValues
    // showParticles ? { count: 500, length: 50, stepEpsilon: 0.02 } : undefined
  );

  const maxSize = 0.8 * step;
  const scaleFactor = maxSize / (maxLength || 1);

  const { scale, position, rotation } = useWorldCoordinateTransformation();

  const clippingPlanes = useClippingPlanes(
    viewInfo.dimension.value === "3D" ? ["x", "y", "z"] : ["x", "y"]
  );

  const pathGroupRef = useRef<Group>(null);
  useFrame(() => {
    if (!pathGroupRef.current) return;

    pathGroupRef.current.children.forEach((child, index) => {
      if (child instanceof Line2) {
        child.material.dashOffset =
          (index * 0.1 - Date.now() * 0.0004) %
          (child.material.dashSize + child.material.gapSize);
      }
    });
  });

  const linesGroupRef = useRef<Group>(null);
  useFrame(() => {
    if (showParticles) {
      updateLines(linesGroupRef.current ?? undefined);
    }
  });

  return (
    <>
      {vectors.map((vector, i) => {
        const origin = origins[i];

        return (
          <Vector
            key={`${origin.x},${origin.y},${origin.z}`}
            origin={origin}
            value={vector.clone().multiplyScalar(scaleFactor)}
            color={
              color === "rainbow"
                ? new ThreeColor().setHSL(
                    Math.atan2(vector.y, vector.x) / (2 * Math.PI),
                    1,
                    0.5
                  )
                : getColor(color)
            }
            showHead={showHead}
            showTail={showTail}
            showAsCone={showAsCone}
          />
        );
      })}
      {showParticles && (
        <group ref={linesGroupRef}>
          {linePositionArrays.map((positions, i) => (
            <line_
              key={i}
              scale={scale}
              position={position}
              rotation={rotation}
            >
              <bufferGeometry attach="geometry">
                <bufferAttribute
                  attach="attributes-position"
                  array={positions}
                  itemSize={3}
                  count={lineLength}
                />
                <bufferAttribute
                  attach="attributes-color"
                  array={lineColorArrays[i]}
                  normalized={true}
                  itemSize={4}
                  count={lineLength}
                />
              </bufferGeometry>
              <lineBasicMaterial
                attach="material"
                vertexColors={true}
                transparent={true}
                clippingPlanes={clippingPlanes}
              />
            </line_>
          ))}
        </group>
      )}
    </>
  );
}
