import { useContext, useMemo } from "react";
import { Graph3DContext } from "./Graph3D";
import { GraphGridLine3D } from "./GraphGridLine3D";

interface GraphGrid3DProps {
  normalAxis: "x" | "y" | "z";
}

export function GraphGrid3D({ normalAxis }: GraphGrid3DProps) {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;

  const scale = 1;

  const gridXValues = useMemo(() => {
    let gridXValues = new Set<number>();
    gridXValues.add(window[0][0]);
    for (
      let x = (Math.floor(window[0][0] / scale) + 1) * scale;
      x < window[1][0];
      x += scale
    ) {
      gridXValues.add(x);
    }
    gridXValues.add(window[1][0]);
    return [...gridXValues];
  }, [window]);

  const gridYValues = useMemo(() => {
    let gridYValues = new Set<number>();
    gridYValues.add(window[0][1]);
    for (
      let y = (Math.floor(window[0][1] / scale) + 1) * scale;
      y < window[1][1];
      y += scale
    ) {
      gridYValues.add(y);
    }
    gridYValues.add(window[1][1]);
    return [...gridYValues];
  }, [window]);

  const gridZValues = useMemo(() => {
    let gridZValues = new Set<number>();
    gridZValues.add(window[0][2]);
    for (
      let z = (Math.floor(window[0][2] / scale) + 1) * scale;
      z < window[1][2];
      z += scale
    ) {
      gridZValues.add(z);
    }
    gridZValues.add(window[1][2]);
    return [...gridZValues];
  }, [window]);

  if (normalAxis === "x") {
    return (
      <>
        {gridYValues.map((y) => (
          <GraphGridLine3D key={`y-${y},z`} x={0} y={y} z={null} />
        ))}
        {gridZValues.map((z) => (
          <GraphGridLine3D key={`z-${z},y`} x={0} y={null} z={z} />
        ))}
      </>
    );
  }

  if (normalAxis === "y") {
    return (
      <>
        {gridXValues.map((x) => (
          <GraphGridLine3D key={`x-${x},z`} x={x} y={0} z={null} />
        ))}
        {gridZValues.map((z) => (
          <GraphGridLine3D key={`z-${z},x`} x={null} y={0} z={z} />
        ))}
      </>
    );
  }

  if (normalAxis === "z") {
    return (
      <>
        {gridXValues.map((x) => (
          <GraphGridLine3D key={`x-${x},y`} x={x} y={null} z={0} />
        ))}
        {gridYValues.map((y) => (
          <GraphGridLine3D key={`y-${y},x`} x={null} y={y} z={0} />
        ))}
      </>
    );
  }

  return null;
}
