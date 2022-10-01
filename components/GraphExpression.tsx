import { useContext, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import * as math from "mathjs";
import { GraphContext, GraphLayer } from "./Graph";

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
