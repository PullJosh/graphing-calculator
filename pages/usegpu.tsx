import { LiveCanvas } from "@use-gpu/react";

import { Component } from "../components/UseGPU/component";

export default function UseGPUTestPage() {
  return (
    <div>
      <h1>Use GPU Test</h1>
      <LiveCanvas>
        {/* These are live children */}
        {(canvas) => <Component canvas={canvas} />}
      </LiveCanvas>
    </div>
  );
}
