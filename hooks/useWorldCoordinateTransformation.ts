import { useContext } from "react";
import { Euler, Vector3 } from "three";
import { Graph3DContext } from "../components/Graph3D/Graph3D";

export function useWorldCoordinateTransformation() {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;
  const windowWorldCoordinates = viewInfo.windowWorldCoordinates.value;

  const scale = new Vector3(
    window[1][0] === window[0][0]
      ? 1
      : (windowWorldCoordinates[1][0] - windowWorldCoordinates[0][0]) /
        (window[1][0] - window[0][0]),
    window[1][1] === window[0][1]
      ? 1
      : (windowWorldCoordinates[1][1] - windowWorldCoordinates[0][1]) /
        (window[1][1] - window[0][1]),
    window[1][2] === window[0][2]
      ? 1
      : (windowWorldCoordinates[1][2] - windowWorldCoordinates[0][2]) /
        (window[1][2] - window[0][2])
  );

  const position = new Vector3(
    (-(window[0][0] + window[1][0]) / 2) * scale.x,
    (-(window[0][2] + window[1][2]) / 2) * scale.z,
    ((window[0][1] + window[1][1]) / 2) * scale.y
  );

  const rotation = new Euler(-Math.PI / 2, 0, 0);

  return { scale, position, rotation };
}
