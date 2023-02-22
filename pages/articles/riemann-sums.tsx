import { Graph3D } from "../../components/Graph3D/Graph3D";
import { GraphAxis3D } from "../../components/Graph3D/GraphAxis3D";
import { GraphGrid3D } from "../../components/Graph3D/GraphGrid3D";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { extend, Object3DNode } from "@react-three/fiber";
import { Contour } from "../../components/Graph3D/display/Contour";
import { Shape, Vector2 } from "three";
import { Area } from "../../components/Graph3D/display/Area";
import { useState } from "react";

extend({ ParametricGeometry });

declare module "@react-three/fiber" {
  interface ThreeElements {
    parametricGeometry: Object3DNode<
      ParametricGeometry,
      typeof ParametricGeometry
    >;
  }
}

const smoothShape = getFunctionAreaShape((x) => 2 * (x / 3) ** 2 + 1, -3, 3);

export default function RiemannSums() {
  return (
    <div className="container mx-auto px-16 py-8">
      <div className="prose">
        <h1>Riemann Sums</h1>
        <p>What is the area of the following shape?</p>
        <SharpAreaGuessGame />
        <p>
          Not so bad, right? Adding up rectangular areas is easy.{" "}
          <strong>But what if you have a curvey shape, like this?</strong>
        </p>
        <div className="relative h-96 border">
          <Graph3D
            defaultDimension="2D"
            showControls={false}
            defaultWindowCenter={[0, 2]}
            defaultWindowArea={50}
          >
            {() => (
              <>
                <GraphGrid3D />
                <GraphAxis3D axis="x" />
                <GraphAxis3D axis="y" />
                <Area shape={smoothShape} color="red" />
              </>
            )}
          </Graph3D>
        </div>
      </div>
    </div>
  );
}

const sharpShape = new Shape([
  new Vector2(-3, 0),
  new Vector2(-3, 3),
  new Vector2(-1, 3),
  new Vector2(-1, 2),
  new Vector2(1, 2),
  new Vector2(1, 1),
  new Vector2(3, 1),
  new Vector2(3, 0),
  new Vector2(-3, 0),
]);

function SharpAreaGuessGame() {
  const [guess, setGuess] = useState("");

  const guessNumber = Number(guess);

  const { audioContext, gainNode, oscillator } = useWaveformSound();

  return (
    <div className="border divide-y rounded-xl overflow-hidden">
      <div className="relative h-96">
        <Graph3D
          defaultDimension="2D"
          showControls={false}
          defaultWindowCenter={[0, 1.5]}
          defaultWindowArea={50}
        >
          {() => (
            <>
              <GraphGrid3D />
              <GraphAxis3D axis="x" />
              <GraphAxis3D axis="y" />
              <Area shape={sharpShape} color="red" />
            </>
          )}
        </Graph3D>
      </div>
      <div className="flex items-center justify-start p-2 space-x-2 bg-gray-100">
        <input
          type="number"
          className="border rounded pl-4 pr-2 py-2 text-2xl w-48"
          min={0}
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
        />
        <button
          className="bg-blue-600 text-white self-stretch px-4 py-2 text-lg rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={guessNumber <= 0}
          onClick={() => {
            if (gainNode!.gain.value === 0) {
              // oscillator!.setPeriodicWave();
              oscillator!.frequency.value = 100;
              gainNode!.gain.value = 440;
            } else {
              gainNode!.gain.value = 0;
            }
          }}
        >
          Guess Area
        </button>
      </div>
    </div>
  );
}

function getFunctionAreaShape(
  f: (x: number) => number,
  a: number,
  b: number,
  divisions = 25
) {
  const shape = new Shape([new Vector2(a, 0)]);
  for (let i = 0; i <= divisions; i++) {
    const x = a + (b - a) * (i / divisions);
    const y = f(x);
    shape.lineTo(x, y);
  }
  shape.lineTo(b, 0);
  shape.autoClose = true;
  return shape;
}

function useWaveformSound() {
  const [stuff] = useState(() => {
    if (typeof AudioContext === "undefined") {
      return {};
    }

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0;

    oscillator.start();

    return { audioContext, oscillator, gainNode };
  });

  return stuff;
}
