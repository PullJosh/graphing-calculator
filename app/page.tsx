"use client";

import { useEffect, useReducer, useState } from "react";
import { Euler, Vector3 } from "three";
import { Graph3D } from "../components/Graph3D/Graph3D";
import { GraphBoundingBox3D } from "../components/Graph3D/GraphBoundingBox3D";
import { GraphSurfaceGridMaterial } from "../components/Graph3D/GraphSurfaceGridMaterial";
import Link from "next/link";
import { Navigation } from "../components/Navigation";

export default function Index() {
  const time = useTimeSinceMount();

  return (
    <div>
      <Navigation />

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
            <Graph3D view="3D-perspective" autoRotate={true}>
              {() => (
                <>
                  <GraphBoundingBox3D />
                  <mesh
                    scale={new Vector3(0.2, 0.2, 0.2)}
                    rotation={new Euler((time / 1000 / 10) * Math.PI, 0, 0)}
                  >
                    <planeGeometry attach="geometry" args={[15, 15, 1, 1]} />
                    <GraphSurfaceGridMaterial color="blue" />
                  </mesh>
                  <mesh
                    scale={new Vector3(0.2, 0.2, 0.2)}
                    position={new Vector3(0, 0, 0)}
                  >
                    <coneGeometry
                      attach="geometry"
                      args={[5, 10, 64, 1, true]}
                    />
                    <GraphSurfaceGridMaterial color="red" />
                  </mesh>
                </>
              )}
            </Graph3D>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="container mx-auto px-16">
          <div className="prose">
            <h2>Articles</h2>
            <ul>
              <li>
                <Link href="/articles/parabolas">Parabolas</Link>
              </li>
              <li>
                <Link href="/articles/riemann-sums">Riemann Sums</Link>
              </li>
            </ul>

            <h2>Tools</h2>
            <ul>
              <li>
                <Link href="/tools/expression-image-generator">
                  Expression Image Generator
                </Link>
              </li>
              <li>
                <Link href="/tools/complex-domain-coloring-image-generator">
                  Domain Coloring Image Generator (Complex Expressions)
                </Link>
              </li>
            </ul>
          </div>
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
