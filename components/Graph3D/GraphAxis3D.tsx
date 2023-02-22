import { GraphGridLine3D } from "./GraphGridLine3D";
import { Vector3 } from "three";
import { useContext, useEffect, useState } from "react";
import { Graph3DContext } from "./Graph3D";
import { GraphText3D } from "./GraphText3D";
import { lerpVec3 } from "../../utils/lerp";
import { useFrame, useThree } from "@react-three/fiber";

interface GraphAxis3DProps {
  axis: "x" | "y" | "z";
  label?: string;
}

export function GraphAxis3D({ axis, label = axis }: GraphAxis3DProps) {
  const { toSceneX, toSceneY, toSceneZ, windowWorldCoordinates, dimension } =
    useContext(Graph3DContext);

  let textPosition = new Vector3(toSceneX(0), toSceneZ(0), -toSceneY(0));
  if (axis === "x") {
    textPosition.x = windowWorldCoordinates.value[1][0];
  }
  if (axis === "y") {
    textPosition.z = -windowWorldCoordinates.value[1][1];
  }
  if (axis === "z") {
    textPosition.y = windowWorldCoordinates.value[1][2];
  }

  const fromDimension = dimension.from ?? dimension.value;
  const toDimension = dimension.to ?? dimension.value;
  const fromOpacity = getOpacity(fromDimension, axis);
  const toOpacity = getOpacity(toDimension, axis);
  const progress = dimension.progress ?? 1;
  const opacity = fromOpacity + (toOpacity - fromOpacity) * progress;

  const { camera } = useThree();
  const cameraDirection = new Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(camera.quaternion);
  const viewingAxisDirectly = {
    x: cameraDirection.dot(new Vector3(1, 0, 0)) < -0.95,
    y: cameraDirection.dot(new Vector3(0, 0, 1)) > 0.95,
    z: cameraDirection.dot(new Vector3(0, 1, 0)) < -0.95,
  }[axis];

  const positionOffset3D = useAnimatedVector3(
    {
      x: viewingAxisDirectly
        ? new Vector3(0.1, 0.08, -0.08)
        : new Vector3(0.1, 0, 0),
      y: viewingAxisDirectly
        ? new Vector3(-0.08, 0.1, -0.1)
        : new Vector3(0, 0, -0.1),
      z: viewingAxisDirectly
        ? new Vector3(0.06, 0.1, -0.08)
        : new Vector3(0, 0.1, 0),
    }[axis]
  );
  const positionOffset2D = {
    x: new Vector3(-0.1, 0, -0.12),
    y: new Vector3(0.1, 0, 0.1),
    z: new Vector3(0, 0, 0),
  }[axis];
  const fromOffset =
    fromDimension === "3D" ? positionOffset3D : positionOffset2D;
  const toOffset = toDimension === "3D" ? positionOffset3D : positionOffset2D;
  textPosition = textPosition.add(lerpVec3(fromOffset, toOffset, progress));

  // Log myself in the axisComponentCounts context
  // so that the GraphGrid3D component knows
  const { setAxisComponentCounts } = useContext(Graph3DContext);
  useEffect(() => {
    setAxisComponentCounts((axisComponentCounts) => ({
      ...axisComponentCounts,
      [axis]: axisComponentCounts[axis] + 1,
    }));
    return () => {
      setAxisComponentCounts((axisComponentCounts) => ({
        ...axisComponentCounts,
        [axis]: axisComponentCounts[axis] - 1,
      }));
    };
  });

  return (
    <>
      <GraphGridLine3D
        x={axis === "x" ? null : 0}
        y={axis === "y" ? null : 0}
        z={axis === "z" ? null : 0}
        color="#64748b"
        width={2}
        arrows={true}
      />
      <GraphText3D
        position={textPosition}
        fontSize={0.13}
        color="#64748b"
        opacity={opacity}
      >
        {label}
      </GraphText3D>
    </>
  );
}

function getOpacity(dimension: "1D" | "2D" | "3D", axis: "x" | "y" | "z") {
  return {
    "1D": { x: 1, y: 0, z: 0 },
    "2D": { x: 1, y: 1, z: 0 },
    "3D": { x: 1, y: 1, z: 1 },
  }[dimension][axis];
}

function useAnimatedVector3(target: Vector3) {
  const [value, setValue] = useState(target);

  useFrame(() => {
    setValue(value.lerp(target, 0.2));
  });

  return value;
}
