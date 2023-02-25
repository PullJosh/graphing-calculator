import { useContext, useMemo } from "react";
import { GraphContours3D } from "./GraphContours3D";
import { useFlatContoursForEquation } from "../../hooks/useFlatContoursForEquation";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { Axis, Box3D } from "../../types";
import { Graph3DContext } from "./Graph3D";
import { useTrianglesForEquation3D } from "../../hooks/useTrianglesForEquation3D";
import { GraphSurfaceGridMaterial } from "./GraphSurfaceGridMaterial";
import { useWorldCoordinateTransformation } from "../../hooks/useWorldCoordinateTransformation";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";
import { BackSide, FrontSide } from "three";
const ce = new ComputeEngine();

interface GraphEquation3DInternalProps {
  equation: string;
  color: "red" | "blue";
  varValues?: Record<string, number>;
  axes?: Axis[];
}

export function GraphEquation3DInternal({
  equation,
  color,
  varValues = {},
  axes,
}: GraphEquation3DInternalProps) {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;

  const graphWindow: Box3D = {
    minX: window[0][0],
    maxX: window[1][0],
    minY: window[0][1],
    maxY: window[1][1],
    minZ: window[0][2],
    maxZ: window[1][2],
  };

  const mathJSON = useMemo(() => ce.parse(equation), [equation]);

  // Get contours if it's a 2D equation
  const flatContours = useFlatContoursForEquation(
    mathJSON,
    graphWindow,
    7n,
    4n,
    varValues,
    (axes as [string, string]) ?? ["x", "y"]
  );

  // Get triangles if it's a 3D equation
  const triangles = useTrianglesForEquation3D(
    mathJSON,
    graphWindow,
    varValues,
    (axes as [string, string, string]) ?? ["x", "y", "z"]
  );

  const transformation = useWorldCoordinateTransformation();

  const clippingPlanes = useClippingPlanes();

  if (flatContours.length > 0) {
    return <GraphContours3D flatContours={flatContours} color={color} />;
  } else if (triangles.length > 0) {
    const trianglesString = JSON.stringify(triangles);
    const trianglesF32 = new Float32Array(triangles);

    return (
      <>
        <mesh {...transformation}>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.computeVertexNormals();
            }}
          >
            <bufferAttribute
              key={trianglesString}
              attach="attributes-position"
              array={trianglesF32}
              count={triangles.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <GraphSurfaceGridMaterial color={color} side={FrontSide} />
        </mesh>
        <mesh {...transformation}>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.computeVertexNormals();
            }}
          >
            <bufferAttribute
              key={trianglesString}
              attach="attributes-position"
              array={trianglesF32}
              count={triangles.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <GraphSurfaceGridMaterial color={color} side={BackSide} />
        </mesh>
      </>
    );
  } else {
    return null;
  }
}
