"use client";

import { Graph3D } from "../../../components/Graph3D/Graph3D";
import { GraphExpression3D } from "../../../components/Graph3D/GraphExpression3D";

import { useCallback, useRef, useState } from "react";
import { GraphAxis3D } from "../../../components/Graph3D/GraphAxis3D";
import dynamic from "next/dynamic";
import { Vector3 } from "three";

const MathLiveInput = dynamic(
  () =>
    import("../../../components/MathLiveInput").then(
      (mod) => mod.MathLiveInput
    ),
  { ssr: false }
);

export default function ExpressionImageGenerator() {
  const [latex, setLatex] = useState("x^2+y^2");
  const [showAxes, setShowAxes] = useState(true);
  const [windowSize, setWindowSize] = useState(5);

  const scaleFactor = 5 / windowSize;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const save = useCallback(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = canvasRef.current!.width;
    canvas.height = canvasRef.current!.height;
    canvas.style.width = "300px";

    const threeCtx = canvasRef.current!.getContext("webgl2")!;
    console.log(threeCtx);

    const pixels = new Uint8ClampedArray(
      threeCtx.drawingBufferWidth * threeCtx.drawingBufferHeight * 4
    );
    threeCtx.readPixels(
      0,
      0,
      threeCtx.drawingBufferWidth,
      threeCtx.drawingBufferHeight,
      threeCtx.RGBA,
      threeCtx.UNSIGNED_BYTE,
      pixels
    );
    const imageData = new ImageData(pixels, canvas.width, canvas.height);
    console.log(pixels, imageData);

    // ctx!.drawImage(canvasRef.current!, 0, 0);
    // ctx!.putImageData(new ImageData(), 0, 0);

    document.body.appendChild(canvas);

    // canvas.toBlob(function (blob) {
    //   const item = new ClipboardItem({ "image/png": blob! });
    //   navigator.clipboard.write([item]);
    //   // alert("Copied to clipboard!");
    // });
  }, []);

  return (
    <div className="container mx-auto px-16">
      <div className="prose">
        <h1>Expression Image Generator</h1>

        <div className="w-[600px] h-[600px] relative">
          <div className="absolute z-50 bottom-0 left-0 bg-white text-3xl px-8 py-3">
            <MathLiveInput
              latex={latex}
              onChange={(newLatex) => setLatex(newLatex)}
            />
          </div>
          <Graph3D ref={canvasRef} view="2D">
            {() => (
              <>
                {showAxes && (
                  <>
                    <GraphAxis3D axis="x" />
                    <GraphAxis3D axis="y" />
                  </>
                )}
                <group
                  scale={new Vector3(scaleFactor, scaleFactor, scaleFactor)}
                >
                  <GraphExpression3D expression={latex} />
                </group>
              </>
            )}
          </Graph3D>
        </div>

        <label>
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(event) => setShowAxes(event.target.checked)}
          />{" "}
          <span>Show axes</span>
        </label>

        <label>
          <input
            type="range"
            value={windowSize}
            min={0.1}
            max={5}
            step={0.1}
            onChange={(event) => setWindowSize(event.target.valueAsNumber)}
          />{" "}
          <span>Window size: {windowSize}</span>
        </label>

        <div>
          <button onClick={() => save()}>Save</button>
        </div>
      </div>
    </div>
  );
}
