import { useContext, useMemo, useRef } from "react";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { Box3D } from "../../types";
import { Graph3DContext } from "./Graph3D";
import { useVectorField } from "../../hooks/useVectorField";
import { Vector } from "./display/Vector";
import { Color, Group, Vector2 } from "three";
import { useWorldCoordinateTransformation } from "../../hooks/useWorldCoordinateTransformation";
import { extend, Object3DNode, useFrame, useThree } from "@react-three/fiber";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";
const ce = new ComputeEngine();

extend({ LineMaterial, Line2 });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    line2: Object3DNode<Line2, typeof Line2>;
  }
}

interface GraphVectorField3DInternalProps {
  expressions: string[];
  step?: number;
  color: "red" | "blue";
  varValues?: Record<string, number>;
  showHead?: boolean;
  showTail?: boolean;
  showAsCone?: boolean;
  showParticles?: boolean;
  // axes?: Axis[];
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

  const { origins, vectors, maxLength, paths } = useVectorField(
    mathJSON,
    graphWindow,
    step,
    varValues,
    showParticles ? { count: 500, length: 50, stepEpsilon: 0.02 } : undefined
  );

  const maxSize = 0.8 * step;
  const scaleFactor = maxSize / (maxLength || 1);

  const { scale, position, rotation } = useWorldCoordinateTransformation();

  const { size } = useThree();

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

  return (
    <>
      {vectors.map((vector, i) => {
        const origin = origins[i];

        return (
          <Vector
            key={`${origin.x},${origin.y},${origin.z}`}
            origin={origin}
            value={vector.clone().multiplyScalar(scaleFactor)}
            color={new Color().setHSL(
              Math.atan2(vector.y, vector.x) / (2 * Math.PI),
              1,
              0.5
            )}
            showHead={showHead}
            showTail={showTail}
            showAsCone={showAsCone}
          />
        );
      })}
      {showParticles && (
        <group ref={pathGroupRef} key={paths?.[0]?.[0] ?? 0}>
          {paths.map((path, i) => (
            <line2
              key={i}
              scale={scale}
              position={position}
              rotation={rotation}
              onUpdate={(self) => {
                if (!(self as any).setOnce) {
                  (self as any).setOnce = true;
                  self.geometry.setPositions(new Float32Array(path));
                  self.computeLineDistances();
                }
              }}
            >
              <lineGeometry attach="geometry" />
              <lineMaterial
                attach="material"
                color="blue"
                linewidth={1}
                resolution={new Vector2(size.width, size.height)}
                dashed={true}
                dashScale={1}
                clippingPlanes={clippingPlanes}
                clipping={true}
                onUpdate={(self) => {
                  if (!(self as any).setOnce) {
                    (self as any).setOnce = true;
                    self.dashSize = 0.1 + Math.random();
                    self.gapSize = 0.8 + 3 * Math.random();
                  }
                }}
              />
            </line2>
          ))}
        </group>
      )}
    </>
  );
}
