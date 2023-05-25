import React, { hot } from "@use-gpu/live";
import type { LC } from "@use-gpu/live";
import { Loop, Pass } from "@use-gpu/workbench";

// import test from "./test.wgsl";
// import test from "@use-gpu/wgsl/render/pick.wgsl";

type ComponentProps = {
  canvas: HTMLCanvasElement;
};

// This is a Live component
const ComponentInner: LC<ComponentProps> = (props) => {
  const { canvas } = props;

  // console.log(test);

  // return null;
  return (
    <Loop>
      <Pass></Pass>
    </Loop>
  );
};

export const Component = hot(ComponentInner, module);
