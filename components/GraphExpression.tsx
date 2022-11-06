import { useContext, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { GraphContext, GraphLayer } from "./Graph";
import { BoxedExpression, ComputeEngine } from "@cortex-js/compute-engine";
const ce = new ComputeEngine();

interface GraphExpressionProps {
  expression: string;
  color: "rainbow" | "red" | "blue";
}

export function GraphExpression({ expression, color }: GraphExpressionProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const mathJSON = useMemo(() => ce.parse(expression), [expression]);

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const gl = useMemo(
    () =>
      canvas ? canvas.getContext("webgl", { premultipliedAlpha: false }) : null,
    [canvas]
  );

  // Generate and set shader program when the expression changes
  const shaderInfo = useMemo(() => {
    if (!gl) return null;

    let shaderProgram: WebGLProgram;
    try {
      shaderProgram = createShaderForExpression(gl, mathJSON);
    } catch (err) {
      if (err instanceof KnownExpressionError) {
        // If this is a known/expected error, silently return null
        return null;
      }

      // If this is some other error, log it and return null
      console.log(
        "Expression:",
        expression,
        JSON.stringify(mathJSON.json),
        mathJSON.json
      );
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
  }, [gl, mathJSON]);

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

class KnownExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnownExpressionError";
  }
}

function createShaderForExpression(
  gl: WebGLRenderingContext,
  expression: BoxedExpression
): WebGLProgram {
  const nodeToGL = (node: BoxedExpression["json"]): string => {
    const symbolToGL = (symbol: string) => {
      switch (symbol) {
        case "x":
          return "pos.x";
        case "y":
          return "pos.y";
        case "ExponentialE":
          return "2.718281828459045";
        case "MachineEpsilon":
          return Number.EPSILON.toPrecision(21);
        case "CatalanConstant":
          return "0.915965594177219015054";
        case "GoldenRatio":
          return "1.618033988749894848204";
        case "EulerGamma":
          return "0.577215664901532860606";
        case "Degrees":
          return "57.295779513082320876798";
        case "Pi":
          return Math.PI.toPrecision(21);
        default:
          throw new Error(`Unsupported symbol: ${node}`);
      }
    };

    if (typeof node === "string") {
      return symbolToGL(node);
    }

    if (typeof node === "number") {
      return node.toPrecision(21);
    }

    if ("sym" in node) {
      return symbolToGL(node.sym);
    }

    if ("num" in node) {
      switch (node.num) {
        case "NaN":
          throw new Error("NaN is not supported");
        case "Infinity":
          return "1.0 / 0.0";
        case "-Infinity":
          return "-1.0 / 0.0";
        default:
          try {
            return Number(node.num).toPrecision(21);
          } catch (err) {
            throw new Error(`Unsupported number: ${node.num}`);
          }
      }
    }

    const functionToGL = (name: string, args: string[]) => {
      switch (name) {
        case "Add":
          return `(${args.join(" + ")})`;
        case "Subtract":
          return `(${args.join(" - ")})`;
        case "Negate":
          return `(-${args[0]})`;
        case "Multiply":
          return `(${args.join(" * ")})`;
        case "Divide":
          return `(${args.join(" / ")})`;
        case "Power":
          return `pow(${args[0]}, ${args[1]})`;
        case "Root":
          return `pow(${args[0]}, 1.0 / ${args[1]})`;
        case "Sqrt":
          return `sqrt(${args[0]})`;
        case "Square":
          return `(${args[0]} * ${args[0]})`;
        case "Exp":
          return `exp(${args[0]})`;
        case "Ln":
          return `log(${args[0]})`;
        case "Log":
          return `log(${args[0]}) / log(${args[1] ?? "10"})`;
        case "Lb":
          return `log(${args[0]}) / log(2.0)`;
        case "Lg":
          return `log(${args[0]}) / log(10.0)`;
        case "Sin":
          return `sin(${args[0]})`;
        case "Cos":
          return `cos(${args[0]})`;
        case "Tan":
          return `tan(${args[0]})`;
        case "Cot":
          return `1.0 / tan(${args[0]})`;
        case "Sec":
          return `1.0 / cos(${args[0]})`;
        case "Csc":
          return `1.0 / sin(${args[0]})`;
        case "ArcSin":
          return `asin(${args[0]})`;
        case "ArcCos":
          return `acos(${args[0]})`;
        case "ArcTan":
          return `atan(${args[0]})`;
        case "ArcTan2":
          return `atan(${args[0]}, ${args[1]})`;
        case "Acot":
          return `atan(1.0, ${args[0]})`;
        case "Asec":
          return `acos(1.0 / ${args[0]})`;
        case "Acsc":
          return `asin(1.0 / ${args[0]})`;
        case "Sinh":
          return `sinh(${args[0]})`;
        case "Cosh":
          return `cosh(${args[0]})`;
        case "Tanh":
          return `tanh(${args[0]})`;
        case "Coth":
          return `1.0 / tanh(${args[0]})`;
        case "Sech":
          return `1.0 / cosh(${args[0]})`;
        case "Csch":
          return `1.0 / sinh(${args[0]})`;
        case "Arsinh":
          return `asinh(${args[0]})`;
        case "Arcosh":
          return `acosh(${args[0]})`;
        case "Artanh":
          return `atanh(${args[0]})`;
        case "Arcoth":
          return `atanh(1.0 / ${args[0]})`;
        case "Asech":
          return `acosh(1.0 / ${args[0]})`;
        case "Acsch":
          return `asinh(1.0 / ${args[0]})`;
        case "Abs":
          return `abs(${args[0]})`;
        case "Ceil":
          return `ceil(${args[0]})`;
        case "Floor":
          return `floor(${args[0]})`;
        case "Round":
          return `round(${args[0]})`;
        case "Clamp":
          return `clamp(${args[0]}, ${args[1] ?? "-1"}, ${args[2] ?? "1"})`;
        case "Max":
          return `max(${args.join(", ")})`;
        case "Min":
          return `min(${args.join(", ")})`;
        case "Rational":
          return `(${args[0]} / ${args[1] ?? "1.0"})`;
      }

      throw new Error(`Unsupported function: ${name}`);
    };

    if (Array.isArray(node)) {
      const fnName = node[0];
      if (typeof fnName !== "string") {
        throw new Error(`Unsupported function name: ${fnName}`);
      }
      if (fnName === "Error") {
        throw new KnownExpressionError("Expression contains error");
      }
      const args = node.slice(1).map(nodeToGL);
      return functionToGL(fnName, args);
    }

    if ("fn" in node) {
      const fnName = node.fn[0];
      if (typeof fnName !== "string") {
        throw new Error(`Unsupported function name: ${fnName}`);
      }
      if (fnName === "Error") {
        throw new KnownExpressionError("Expression contains error");
      }
      const args = node.fn.slice(1).map(nodeToGL);
      return functionToGL(fnName, args);
    }

    if ("str" in node) {
      return JSON.stringify(node.str);
    }

    if ("dict" in node) {
      throw new Error("MathJSON dictionaries are not supported");
    }

    function assertNever(shouldBeNever: never) {}
    assertNever(node);

    throw new Error(`Unsupported node: ${node}`);
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
      float value = ${nodeToGL(expression.json)};
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
