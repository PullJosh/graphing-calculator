import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Box, Contour, Point, TreeNode } from "../lib";
import { useDragPan } from "../hooks/useDragPan";
import classNames from "classnames";
import * as math from "mathjs";

interface GraphContext {
  width: number;
  height: number;
  graphWindow: Box;
}
const GraphContext = createContext<GraphContext | null>(null);

interface GraphProps {
  width?: number;
  height?: number;
  children: ReactNode;
}

export function Graph({ width = 400, height = 400, children }: GraphProps) {
  const [graphWindow, setGraphWindow] = useState<Box>({
    minX: -4,
    maxX: 4,
    minY: -4,
    maxY: 4,
  });

  // Update graph window when width or height changes
  useLayoutEffect(() => {
    setGraphWindow((graphWindow) => {
      let aspectRatio = width / height;
      if (isNaN(aspectRatio)) aspectRatio = 1;

      // When updating graph window, preserve the overall area being displayed
      const area =
        (graphWindow.maxX - graphWindow.minX) *
        (graphWindow.maxY - graphWindow.minY);

      const newGraphWidth = Math.sqrt(area * aspectRatio);
      const newGraphHeight = Math.sqrt(area / aspectRatio);
      const centerX = (graphWindow.maxX + graphWindow.minX) / 2;
      const centerY = (graphWindow.maxY + graphWindow.minY) / 2;

      return {
        minX: centerX - newGraphWidth / 2,
        maxX: centerX + newGraphWidth / 2,
        minY: centerY - newGraphHeight / 2,
        maxY: centerY + newGraphHeight / 2,
      };
    });
  }, [width, height]);

  const { onMouseDown } = useDragPan(graphWindow, (oldWindow, dx, dy) => {
    const xScale = (oldWindow.maxX - oldWindow.minX) / width;
    const yScale = (oldWindow.maxY - oldWindow.minY) / height;

    setGraphWindow({
      minX: oldWindow.minX - dx * xScale,
      maxX: oldWindow.maxX - dx * xScale,
      minY: oldWindow.minY + dy * yScale,
      maxY: oldWindow.maxY + dy * yScale,
    });
  });

  return (
    <div
      className="relative"
      style={{ width, height }}
      onMouseDown={onMouseDown}
    >
      <GraphContext.Provider value={{ width, height, graphWindow }}>
        {children}
      </GraphContext.Provider>
    </div>
  );
}

interface GraphLayerProps {
  children: ReactNode;
}

function GraphLayer({ children }: GraphLayerProps) {
  return <div className="absolute top-0 left-0 w-full h-full">{children}</div>;
}

function getCoordinateTransformations(
  graphWindow: Box,
  width: number,
  height: number
) {
  const toScreenPos = ([x, y]: [number, number]): [number, number] => {
    return [
      0.5 +
        width *
          ((x - graphWindow.minX) / (graphWindow.maxX - graphWindow.minX)),
      0.5 +
        height *
          (1 - (y - graphWindow.minY) / (graphWindow.maxY - graphWindow.minY)),
    ];
  };

  return { toScreenPos };
}

function useContoursForEquation(
  equation: string,
  graphWindow: Box
): {
  tree: TreeNode | null;
  contours: Contour[] | null;
  marchingSquaresContours: Contour[] | null;
} {
  const workerRef = useRef<Worker | null>(null);
  const [contours, setContours] = useState<Contour[] | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [marchingSquaresContours, setMarchingSquaresContours] = useState<
    Contour[] | null
  >(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/graphEquation.worker.ts", import.meta.url)
    );
    workerRef.current.onmessage = (event) => {
      const { data } = event;
      if ("contours" in data) {
        setContours(data.contours);
      }
      if ("tree" in data) {
        setTree(data.tree);
      }
      if ("marchingSquaresContours" in data) {
        setMarchingSquaresContours(data.marchingSquaresContours);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ equation, graphWindow });
  }, [equation, graphWindow]);

  return { tree, contours, marchingSquaresContours };
}

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
  debug?: boolean;
}

export function GraphEquation({
  equation,
  color,
  debug = false,
}: GraphEquationProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const { tree, contours, marchingSquaresContours } = useContoursForEquation(
    equation,
    graphWindow
  );
  if (!contours) return null;

  let children: ReactNode[] = [];

  if (debug && tree) {
    const drawTree = (node: TreeNode) => {
      switch (node.type) {
        case "zero": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="blue"
              stroke="navy"
              strokeWidth={1}
            />
          );
          break;
        }
        case "negative": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="#333"
              stroke="#111"
              strokeWidth={1}
            />
          );
          break;
        }
        case "positive": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="#ddd"
              stroke="#ccc"
              strokeWidth={1}
            />
          );
          break;
        }
        case "leaf": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="white"
              stroke="lime"
              strokeWidth={1}
            />
          );
          break;
        }
        case "root":
          for (const child of node.children) {
            drawTree(child);
          }
          break;
      }
    };

    drawTree(tree);
  }

  if (debug && marchingSquaresContours) {
    for (let i = 0; i < marchingSquaresContours.length; i++) {
      const contour = marchingSquaresContours[i];
      let points: Point[] = [];

      for (const point of contour.points) {
        points.push(toScreenPos(point));
      }

      children.push(
        <polyline
          key={`msc-${i}`}
          strokeWidth={3}
          className="stroke-purple-600"
          fill="none"
          points={points.map((pt) => pt.join(",")).join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    }
  }

  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    let points: Point[] = [];

    for (const point of contour.points) {
      points.push(toScreenPos(point));
    }

    children.push(
      <polyline
        key={`c-${i}`}
        strokeWidth={3}
        className={classNames({
          "stroke-red-600": color === "red",
          "stroke-blue-600": color === "blue",
        })}
        fill="none"
        points={points.map((pt) => pt.join(",")).join(" ")}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    );
  }

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {children}
      </svg>
    </GraphLayer>
  );
}

interface GraphGridProps {
  xStep: number;
  yStep: number;
}

export function GraphGrid({ xStep, yStep }: GraphGridProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const children: ReactNode[] = [];

  for (
    let x = Math.ceil(graphWindow.minX / xStep) * xStep;
    x <= Math.floor(graphWindow.maxX / xStep) * xStep;
    x += xStep
  ) {
    const [sx, sy] = toScreenPos([x, graphWindow.minY]);
    const [ex, ey] = toScreenPos([x, graphWindow.maxY]);

    children.push(
      <line
        key={`x-${x}`}
        className={classNames({
          "stroke-gray-300": x !== 0,
          "stroke-gray-500": x === 0,
        })}
        strokeWidth={1}
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
      />
    );
  }

  for (
    let y = Math.ceil(graphWindow.minY / yStep) * yStep;
    y <= Math.floor(graphWindow.maxY / xStep) * xStep;
    y += yStep
  ) {
    const [sx, sy] = toScreenPos([graphWindow.minX, y]);
    const [ex, ey] = toScreenPos([graphWindow.maxX, y]);

    children.push(
      <line
        key={`y-${y}`}
        className={classNames({
          "stroke-gray-300": y !== 0,
          "stroke-gray-500": y === 0,
        })}
        strokeWidth={1}
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
      />
    );
  }

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {children}
      </svg>
    </GraphLayer>
  );
}

interface GraphPointProps {
  point: [number, number];
  color: "red" | "blue";
  size?: number;
}

export function GraphPoint({ point, color, size = 8 }: GraphPointProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const pos = toScreenPos(point);

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle
          cx={pos[0]}
          cy={pos[1]}
          r={size}
          className={classNames({
            "fill-red-600": color === "red",
            "fill-blue-600": color === "blue",
          })}
        />
      </svg>
    </GraphLayer>
  );
}

interface GraphLineProps {
  line: [Point, Point];
  color: "red" | "blue";
}

export function GraphLine({ line, color }: GraphLineProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const [A, B] = line;

  const start: Point = [
    A[0] + (B[0] - A[0]) * 1000,
    A[1] + (B[1] - A[1]) * 1000,
  ];
  const end: Point = [A[0] - (B[0] - A[0]) * 1000, A[1] - (B[1] - A[1]) * 1000];

  const [sx, sy] = toScreenPos(start);
  const [ex, ey] = toScreenPos(end);

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          className={classNames({
            "stroke-red-600": color === "red",
            "stroke-blue-600": color === "blue",
          })}
          strokeWidth={3}
        />
      </svg>
    </GraphLayer>
  );
}

interface GraphExpressionProps {
  expression: string;
  color: "rainbow" | "red" | "blue";
}

export function GraphExpression({ expression, color }: GraphExpressionProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const gl = useMemo(
    () =>
      canvas ? canvas.getContext("webgl", { premultipliedAlpha: false }) : null,
    [canvas]
  );

  // Generate and set shader program when the expression changes
  const shaderInfo = useMemo(() => {
    if (!gl) return null;

    let node: math.MathNode;
    try {
      node = math.parse(expression);
    } catch (err) {
      console.error(err);
      return null;
    }

    let shaderProgram: WebGLProgram;
    try {
      shaderProgram = createShaderForExpression(gl, node);
    } catch (err) {
      console.error(err);
      return null;
    }

    gl.useProgram(shaderProgram);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uMinPos = gl.getUniformLocation(shaderProgram, "uMinPos");
    const uMaxPos = gl.getUniformLocation(shaderProgram, "uMaxPos");
    const uCanvasSize = gl.getUniformLocation(shaderProgram, "uCanvasSize");
    const uColor = gl.getUniformLocation(shaderProgram, "uColor");
    const uIsRainbow = gl.getUniformLocation(shaderProgram, "uIsRainbow");
    return { uMinPos, uMaxPos, uCanvasSize, uColor, uIsRainbow };
  }, [gl, expression]);

  // Render
  useEffect(() => {
    if (!canvas || !gl || !shaderInfo) return;

    // Make sure the viewport matches the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set uniform values
    gl.uniform2f(shaderInfo.uMinPos, graphWindow.minX, graphWindow.minY);
    gl.uniform2f(shaderInfo.uMaxPos, graphWindow.maxX, graphWindow.maxY);
    gl.uniform2f(shaderInfo.uCanvasSize, width, height);
    gl.uniform1f(shaderInfo.uIsRainbow, color === "rainbow" ? 1 : 0);
    switch (color) {
      case "red":
        gl.uniform3f(shaderInfo.uColor, 220 / 255, 38 / 255, 38 / 255);
        break;
      case "blue":
        gl.uniform3f(shaderInfo.uColor, 37 / 255, 99 / 255, 235 / 255);
        break;
      default:
        gl.uniform3f(shaderInfo.uColor, 0.0, 0.0, 0.0);
        break;
    }

    // Render
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [canvas, gl, shaderInfo, graphWindow, width, height, color]);

  return (
    <GraphLayer>
      <canvas
        ref={setCanvas}
        className={classNames({
          hidden: !gl || !shaderInfo,
        })}
        width={width}
        height={height}
      />
    </GraphLayer>
  );
}

function createShaderForExpression(
  gl: WebGLRenderingContext,
  expression: math.MathNode
): WebGLProgram {
  const nodeToGL = (node: math.MathNode): string => {
    switch (node.type) {
      case "OperatorNode":
        switch (node.fn) {
          case "add":
            return `(${nodeToGL(node.args[0])} + ${nodeToGL(node.args[1])})`;
          case "subtract":
            return `(${nodeToGL(node.args[0])} - ${nodeToGL(node.args[1])})`;
          case "multiply":
            return `(${nodeToGL(node.args[0])} * ${nodeToGL(node.args[1])})`;
          case "divide":
            return `(${nodeToGL(node.args[0])} / ${nodeToGL(node.args[1])})`;
          case "pow":
            return `pow(${nodeToGL(node.args[0])}, ${nodeToGL(node.args[1])})`;
          case "unaryPlus":
            return `(${nodeToGL(node.args[0])})`;
          case "unaryMinus":
            return `(-(${nodeToGL(node.args[0])}))`;
          default:
            throw new Error(`Unsupported operator: ${node.fn}`);
        }
      case "ConstantNode": {
        return Number(node.value).toPrecision(21);
      }
      case "SymbolNode":
        switch (node.name) {
          case "x":
            return "pos.x";
          case "y":
            return "pos.y";
          case "pi":
            return Math.PI.toPrecision(21);
          default:
            throw new Error(`Unsupported symbol: ${node.name}`);
        }
      case "ParenthesisNode":
        return `(${nodeToGL(node.content)})`;
      case "FunctionNode":
        switch (node.fn.name) {
          case "sin":
            return `sin(${nodeToGL(node.args[0])})`;
          case "cos":
            return `cos(${nodeToGL(node.args[0])})`;
          case "tan":
            return `tan(${nodeToGL(node.args[0])})`;
          case "asin":
            return `asin(${nodeToGL(node.args[0])})`;
          case "acos":
            return `acos(${nodeToGL(node.args[0])})`;
          case "atan":
            return `atan(${nodeToGL(node.args[0])})`;
          case "sqrt":
            return `sqrt(${nodeToGL(node.args[0])})`;
          case "exp":
            return `exp(${nodeToGL(node.args[0])})`;
          case "log":
            return `log(${nodeToGL(node.args[0])})`;
          case "log2":
            return `log2(${nodeToGL(node.args[0])})`;
          case "log10":
            return `log10(${nodeToGL(node.args[0])})`;
          case "abs":
            return `abs(${nodeToGL(node.args[0])})`;
          case "sign":
            return `sign(${nodeToGL(node.args[0])})`;
          case "floor":
            return `floor(${nodeToGL(node.args[0])})`;
          case "ceil":
            return `ceil(${nodeToGL(node.args[0])})`;
          case "min":
            return `min(${nodeToGL(node.args[0])}, ${nodeToGL(node.args[1])})`;
          case "max":
            return `max(${nodeToGL(node.args[0])}, ${nodeToGL(node.args[1])})`;
          case "hypot":
            return `hypot(${nodeToGL(node.args[0])}, ${nodeToGL(
              node.args[1]
            )})`;
          case "pow":
            return `pow(${nodeToGL(node.args[0])}, ${nodeToGL(node.args[1])})`;
          default:
            throw new Error(`Unsupported function: ${node.fn.name}`);
        }
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  };

  const vsSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0, 1);
    }
  `;

  const fsSource = `
    precision highp float;

    uniform vec2 uMinPos;
    uniform vec2 uMaxPos;
    uniform vec2 uCanvasSize;

    uniform vec3 uColor;
    uniform bool uIsRainbow;

    #define PI 3.1415926538

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
  
    void main() {
      vec2 pos = mix(uMinPos, uMaxPos, gl_FragCoord.xy / uCanvasSize);
      float value = ${nodeToGL(expression)};
      if (uIsRainbow) {
        gl_FragColor = vec4(hsv2rgb(vec3(value, 1.0, 1.0)), 1.0);
      } else {
        gl_FragColor = vec4(uColor, sin(2.0 * PI * value + PI / 2.0) * 0.2 + 0.5);
      }
    }
  `;

  function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`An error occurred compiling the shaders: ${infoLog}`);
    }

    return shader;
  }

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram()!;
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    const infoLog = gl.getProgramInfoLog(shaderProgram);
    gl.deleteProgram(shaderProgram);
    throw new Error(`Unable to initialize the shader program: ${infoLog}`);
  }

  return shaderProgram;
}
