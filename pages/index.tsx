import { useEffect, useReducer, useState } from "react";
import { Euler, Vector3 } from "three";
import { Graph3D } from "../components/Graph3D/Graph3D";
import { GraphBoundingBox3D } from "../components/Graph3D/GraphBoundingBox3D";
import { GraphSurface3D } from "../components/Graph3D/GraphSurface3D";
import Link from "next/link";

export default function Index() {
  const time = useTimeSinceMount();

  return (
    <div>
      <nav className="bg-gray-900">
        <div className="container mx-auto px-16">
          <div className="flex items-center py-3">
            <Link href="/" className="text-gray-100 font-bold text-xl">
              Josh's Graphing Calculator
            </Link>
            <Link
              href="/app"
              className="ml-auto text-gray-300 text-md border border-gray-500 px-4 py-2 rounded"
            >
              Start graphing
            </Link>
          </div>
        </div>
      </nav>
      <div className="bg-gray-100 py-24 relative overflow-hidden">
        <div className="container mx-auto px-16 flex flex-col items-start">
          <div className="relative z-10 space-y-8">
            <h1 className="text-6xl font-serif font-bold flex flex-col items-start">
              <span className="block bg-white px-4 pt-4 pb-2">
                <del className="line-through decoration-red-600 decoration-8">
                  Don't
                </del>{" "}
                play with
              </span>
              <span className="block bg-white px-4 pt-2 pb-4">your math.</span>
            </h1>
            <Link
              href="/app"
              className="inline-block bg-blue-600 text-white px-8 py-4 text-3xl border-stripes"
            >
              Launch calculator
            </Link>
          </div>

          <div className="absolute -top-10 -bottom-10 right-0 left-1/3">
            <Graph3D
              showControls={false}
              defaultCameraType="perspective"
              autoRotate={true}
            >
              {() => (
                <>
                  <GraphBoundingBox3D />
                  <GraphSurface3D
                    color="blue"
                    scale={new Vector3(0.2, 0.2, 0.2)}
                    rotation={new Euler((time / 1000 / 10) * Math.PI, 0, 0)}
                  >
                    <planeGeometry attach="geometry" args={[15, 15, 1, 1]} />
                  </GraphSurface3D>
                  <GraphSurface3D
                    color="red"
                    scale={new Vector3(0.2, 0.2, 0.2)}
                    position={new Vector3(0, 0, 0)}
                  >
                    <coneGeometry
                      attach="geometry"
                      args={[5, 10, 64, 1, true]}
                    />
                  </GraphSurface3D>
                </>
              )}
            </Graph3D>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="container mx-auto px-16">
          <h2 className="font-serif font-bold text-2xl">Articles</h2>
          <ul className="list-disc list-inside pl-4">
            <li>
              <Link
                href="/articles/parabolas"
                className="text-blue-700 underline"
              >
                Parabolas
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function useTimeSinceMount() {
  const [startTime] = useState(() => Date.now());
  const currentTime = Date.now();

  const [, forceRerender] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    let cancelled = false;
    const callback = () => {
      if (cancelled) return;
      requestAnimationFrame(callback);
      forceRerender();
    };

    requestAnimationFrame(callback);

    return () => {
      cancelled = true;
    };
  }, []);

  return currentTime - startTime;
}
