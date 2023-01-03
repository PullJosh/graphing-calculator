import classNames from "classnames";
import { ReactNode } from "react";
import { Euler, Vector3 } from "three";
import { Graph3D } from "../../components/Graph3D/Graph3D";
import { GraphAxis3D } from "../../components/Graph3D/GraphAxis3D";
import { GraphBoundingBox3D } from "../../components/Graph3D/GraphBoundingBox3D";
import { GraphCurve3D } from "../../components/Graph3D/GraphCurve3D";
import { GraphEquation3D } from "../../components/Graph3D/GraphEquation3D";
import { GraphGrid3D } from "../../components/Graph3D/GraphGrid3D";
import { GraphSurface3D } from "../../components/Graph3D/GraphSurface3D";
import { Latex } from "../../components/Latex";

let coneParabolaPoints = new Float32Array(((5 - -5 / 4) / 0.02) * 2 * 3);
let i = 0;
for (let x = 5; x > -5 / 4; x -= 0.02) {
  coneParabolaPoints[i++] = (1 / 2) * Math.sqrt(5) * Math.sqrt(4 * x + 5);
  coneParabolaPoints[i++] = -2 * x;
  coneParabolaPoints[i++] = x;
}
for (let x = -5 / 4; x <= 5; x += 0.02) {
  coneParabolaPoints[i++] = (-1 / 2) * Math.sqrt(5) * Math.sqrt(4 * x + 5);
  coneParabolaPoints[i++] = -2 * x;
  coneParabolaPoints[i++] = x;
}

export default function Parabolas() {
  return (
    <div className="container mx-auto px-16">
      <div className="prose">
        <h1>Parabolas</h1>
        <h2>What is a parabola?</h2>
        <ul>
          <li>A parabola is the path a ball follows when it is thrown.</li>
          <li>
            A parabola is a curvy bowl shape:
            <div className="grid grid-cols-[1fr,auto] gap-x-8 not-prose">
              <div className="relative border">
                <Graph3D defaultDimension="2D">
                  {() => (
                    <>
                      <GraphGrid3D normalAxis="z" />
                      <GraphAxis3D axis="x" />
                      <GraphAxis3D axis="y" />
                      <GraphEquation3D equation="y=x^2" color="red" />
                    </>
                  )}
                </Graph3D>
              </div>
              <FunctionTable
                labels={["x", "y"]}
                values={[
                  [-3, -2, -1, 0, 1, 2, 3],
                  [9, 4, 1, 0, 1, 4, 9],
                ]}
              />
            </div>
          </li>
          <li>
            A parabola is a polynomial of degree 2. It can be written in an
            expanded form like{" "}
            <Latex value={String.raw`f(x) = Ax^2 + Bx + C`} /> or a factored
            form like <Latex value={String.raw`f(x) = A(x - B)(x - C)`} />
          </li>
          <li>
            All the points on a parabola are the same distance from a special
            point called the <em>focus</em> as they are from a special line
            called the <em>directrix</em>.
          </li>
          <li>
            A parabola is the shape you get when you slice through a cone like
            this:
            <div className="not-prose">
              <div className="relative w-3/4 aspect-square border">
                <Graph3D
                  defaultDimension="3D"
                  // defaultCameraType="orthographic"
                  showControls={false}
                  autoRotate={true}
                >
                  {() => (
                    <>
                      <GraphGrid3D normalAxis="z" />
                      <GraphAxis3D axis="x" />
                      <GraphAxis3D axis="y" />
                      <GraphBoundingBox3D />
                      <GraphSurface3D
                        color="blue"
                        scale={new Vector3(0.2, 0.2, 0.2)}
                        rotation={new Euler(Math.atan(-1 / 2), 0, 0)}
                      >
                        <planeGeometry
                          attach="geometry"
                          args={[15, 15, 1, 1]}
                        />
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
                      <GraphCurve3D
                        positions={coneParabolaPoints}
                        color="black"
                      />
                    </>
                  )}
                </Graph3D>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface FunctionTableProps {
  labels: string[];
  values: ReactNode[][];
  equalWidths?: boolean;
}

function FunctionTable({
  labels,
  values,
  equalWidths = true,
}: FunctionTableProps) {
  const valuesTransposed = values[0].map((_, i) => values.map((row) => row[i]));

  return (
    <table
      className={classNames("text-center", { "table-fixed": equalWidths })}
    >
      <thead className="bg-gray-100">
        <tr>
          {labels.map((label, i) => (
            <th className="border w-1/2" key={i}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {valuesTransposed.map((row, i) => (
          <tr key={i}>
            {row.map((value, j) => (
              <td className="px-3 border w-1/2" key={j}>
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
