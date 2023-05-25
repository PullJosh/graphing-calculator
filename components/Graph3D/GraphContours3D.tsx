"use client";

import { Fragment, useContext, useMemo } from "react";
import { extend, Object3DNode, useThree } from "@react-three/fiber";

import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { Color, Line, Plane, Vector2, Vector3 } from "three";
import { Graph3DContext } from "./Graph3D";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";
import { GraphSurfaceGridMaterial } from "./GraphSurfaceGridMaterial";
import { lerp } from "../../utils/lerp";
import { getColor } from "../../utils/tailwindColors";

extend({ LineMaterial, LineGeometry, Line2, Line_: Line });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    line2: Object3DNode<Line2, typeof Line2>;
    plane: Object3DNode<Plane, typeof Plane>;
    line_: Object3DNode<Line, typeof Line>;
  }
}

interface GraphContours3DProps {
  flatContours: Float64Array;
  color: "red" | "blue";
}

export function GraphContours3D({ flatContours, color }: GraphContours3DProps) {
  const contours = useMemo(() => {
    // TODO: This can likely be optimized by using Float32Array's .set() method
    // to get rid of the intermediate `contour` array completely.
    let contour: number[] = [];
    let contours: Float32Array[] = [];
    for (let i = 0; i < flatContours.length - 1; i += 2) {
      if (flatContours[i] === Infinity || flatContours[i + 1] === Infinity) {
        if (contour.length > 1) {
          contours.push(new Float32Array(contour));
        }
        contour = [];
      } else {
        contour.push(flatContours[i], 0, -flatContours[i + 1]);
      }
    }
    if (contour.length > 1) {
      contours.push(new Float32Array(contour));
    }
    return contours;
  }, [flatContours]);

  const vertices3D = useMemo(
    () => contoursTo3DVerticesArray(contours),
    [contours]
  );

  const { size } = useThree();

  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;
  const windowWorldCoordinates = viewInfo.windowWorldCoordinates.value;

  const scale = new Vector3(
    window[1][0] === window[0][0]
      ? 1
      : (windowWorldCoordinates[1][0] - windowWorldCoordinates[0][0]) /
        (window[1][0] - window[0][0]),
    window[1][2] === window[0][2]
      ? 1
      : (windowWorldCoordinates[1][2] - windowWorldCoordinates[0][2]) /
        (window[1][2] - window[0][2]),
    window[1][1] === window[0][1]
      ? 1
      : (windowWorldCoordinates[1][1] - windowWorldCoordinates[0][1]) /
        (window[1][1] - window[0][1])
  );

  const position = new Vector3(
    (-(window[0][0] + window[1][0]) / 2) * scale.x,
    (-(window[0][2] + window[1][2]) / 2) * scale.y,
    ((window[0][1] + window[1][1]) / 2) * scale.z
  );

  const clippingPlanes2D = useClippingPlanes(["x", "y"]);

  const { dimension } = viewInfo;

  return (
    <>
      {contours.map((contour, i) => (
        <Fragment key={JSON.stringify(contour)}>
          <line2 scale={scale} position={position}>
            <lineGeometry
              attach="geometry"
              onUpdate={(self) => {
                self.setPositions(contour);
              }}
            />
            <lineMaterial
              attach="material"
              color={getColor(color)}
              toneMapped={false}
              linewidth={lerp(
                (dimension.from ?? dimension.value) === "3D" ? 0 : 3,
                (dimension.to ?? dimension.value) === "3D" ? 0 : 3,
                dimension.progress ?? 0
              )}
              resolution={new Vector2(size.width, size.height)}
              clippingPlanes={clippingPlanes2D}
              clipping={true}
              transparent={true}
            />
          </line2>
          <line_
            scale={scale}
            position={position.clone().setY(windowWorldCoordinates[0][2])}
          >
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                array={contour}
                count={contour.length / 3}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              attach="material"
              color={getColor(color)}
              clippingPlanes={clippingPlanes2D}
            />
          </line_>
          <line_
            scale={scale}
            position={position.clone().setY(windowWorldCoordinates[1][2])}
          >
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                array={contour}
                count={contour.length / 3}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              attach="material"
              color={getColor(color)}
              clippingPlanes={clippingPlanes2D}
            />
          </line_>
        </Fragment>
      ))}
      {vertices3D.length > 0 && (
        <mesh scale={scale} position={position}>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => self.computeVertexNormals()}
          >
            <bufferAttribute
              key={JSON.stringify(vertices3D)}
              attach="attributes-position"
              array={vertices3D}
              count={vertices3D.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <GraphSurfaceGridMaterial color={color} />
        </mesh>
      )}
    </>
  );
}

function contoursTo3DVerticesArray(contours: Float32Array[]): Float32Array {
  // Each line segment becomes a rectangle, which is made up of two triangles.
  // (Each triangle has three points with three coordinates each. So 2 * 3 * 3 =
  // 18 coordinates per line segment.)

  const segmentCount = contours
    .map((contour) => contour.length / 3 - 1)
    .reduce((a, b) => a + b, 0);

  const vertices = new Float32Array(segmentCount * 18);

  let vIndex = 0;
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];

    for (let j = 0; j < contour.length / 3 - 1; j++) {
      // First triangle
      vertices[vIndex++] = contour[j * 3 + 0];
      vertices[vIndex++] = 7.5;
      vertices[vIndex++] = contour[j * 3 + 2];

      vertices[vIndex++] = contour[j * 3 + 0];
      vertices[vIndex++] = -7.5;
      vertices[vIndex++] = contour[j * 3 + 2];

      vertices[vIndex++] = contour[j * 3 + 3];
      vertices[vIndex++] = -7.5;
      vertices[vIndex++] = contour[j * 3 + 5];

      // Second triangle
      vertices[vIndex++] = contour[j * 3 + 0];
      vertices[vIndex++] = 7.5;
      vertices[vIndex++] = contour[j * 3 + 2];

      vertices[vIndex++] = contour[j * 3 + 3];
      vertices[vIndex++] = -7.5;
      vertices[vIndex++] = contour[j * 3 + 5];

      vertices[vIndex++] = contour[j * 3 + 3];
      vertices[vIndex++] = 7.5;
      vertices[vIndex++] = contour[j * 3 + 5];
    }
  }

  return vertices;
}
