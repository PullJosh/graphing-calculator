import { useContext, useMemo } from "react";
import { Plane, Vector3 } from "three";
import { Graph3DContext } from "../components/Graph3D/Graph3D";

export function useClippingPlanes(
  axesToClip: ("x" | "y" | "z")[] = ["x", "y", "z"],
  providedWindowWorldCoordinates?: [
    [number, number, number],
    [number, number, number]
  ]
) {
  const { windowWorldCoordinates } = useContext(Graph3DContext);

  const wwC = providedWindowWorldCoordinates ?? windowWorldCoordinates.value;

  const clippingPlanes = useMemo(() => {
    let planes = [];

    if (axesToClip.includes("x")) {
      planes.push(
        new Plane(new Vector3(1, 0, 0), wwC[1][0]),
        new Plane(new Vector3(-1, 0, 0), -wwC[0][0])
      );
    }
    if (axesToClip.includes("y")) {
      planes.push(
        new Plane(new Vector3(0, 0, 1), wwC[1][1] ?? 1),
        new Plane(new Vector3(0, 0, -1), -(wwC[0][1] ?? -1))
      );
    }
    if (axesToClip.includes("z")) {
      planes.push(
        new Plane(new Vector3(0, 1, 0), wwC[1][2] ?? 1),
        new Plane(new Vector3(0, -1, 0), -(wwC[0][2] ?? -1))
      );
    }
    return planes;
  }, [wwC, axesToClip]);

  return clippingPlanes;
}
