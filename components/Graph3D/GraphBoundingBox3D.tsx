import { useContext } from "react";
import { Graph3DContext } from "./Graph3D";
import { GraphGridLine3D } from "./GraphGridLine3D";

export function GraphBoundingBox3D() {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;

  return (
    <>
      <GraphGridLine3D x={window[0][0]} y={window[0][1]} z={null} />
      <GraphGridLine3D x={window[1][0]} y={window[0][1]} z={null} />
      <GraphGridLine3D x={window[0][0]} y={window[1][1]} z={null} />
      <GraphGridLine3D x={window[1][0]} y={window[1][1]} z={null} />

      <GraphGridLine3D x={window[0][0]} y={null} z={window[0][2]} />
      <GraphGridLine3D x={window[1][0]} y={null} z={window[0][2]} />
      <GraphGridLine3D x={window[0][0]} y={null} z={window[1][2]} />
      <GraphGridLine3D x={window[1][0]} y={null} z={window[1][2]} />

      <GraphGridLine3D x={null} y={window[0][1]} z={window[0][2]} />
      <GraphGridLine3D x={null} y={window[1][1]} z={window[0][2]} />
      <GraphGridLine3D x={null} y={window[0][1]} z={window[1][2]} />
      <GraphGridLine3D x={null} y={window[1][1]} z={window[1][2]} />
    </>
  );
}
