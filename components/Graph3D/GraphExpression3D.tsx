"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
import { BoxedExpression, ComputeEngine } from "@cortex-js/compute-engine";
import { DoubleSide, ShaderMaterial, Vector2 } from "three";
import { Graph3DContext } from "./Graph3D";
import { useApplyUniforms } from "../../hooks/useApplyUniforms";
const ce = new ComputeEngine();

interface GraphExpression3DProps {
  expression: string;
  varValues?: Record<string, number>;
}

export function GraphExpression3D({
  expression,
  varValues: additionalVarValues = {},
}: GraphExpression3DProps) {
  const mathJSON = useMemo(() => ce.parse(expression), [expression]);

  let { varValues } = useContext(Graph3DContext);
  varValues = { ...varValues, ...additionalVarValues };

  const fragmentShaderSource = useMemo(() => {
    try {
      return getFragmentShaderSource(mathJSON, varValues);
    } catch (err) {
      if (!(err instanceof ExpressionError)) {
        console.error(err);
      }

      return null;
    }
  }, [mathJSON, varValues]);

  const materialRef = useRef<ShaderMaterial>(null);
  useEffect(() => {
    if (materialRef.current) {
      if (fragmentShaderSource) {
        materialRef.current.fragmentShader = fragmentShaderSource;
        materialRef.current.needsUpdate = true;
      }
    }
  }, [fragmentShaderSource]);

  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;
  const wwc = viewInfo.windowWorldCoordinates.value;

  useApplyUniforms(materialRef, {
    ...varValues,
    u_vmin: new Vector2(window[0][0], window[0][1]),
    u_vmax: new Vector2(window[1][0], window[1][1]),
  });

  return (
    <mesh
      onUpdate={(self) => {
        self.rotation.x = -Math.PI / 2;
      }}
    >
      <planeGeometry
        attach="geometry"
        args={[wwc[1][0] - wwc[0][0], wwc[1][1] - wwc[0][1], 1, 1]}
      />
      <shaderMaterial
        polygonOffset={true}
        polygonOffsetFactor={50}
        ref={materialRef}
        attach="material"
        visible={!!fragmentShaderSource}
        vertexShader={vertexShaderSource}
        side={DoubleSide}
      />
    </mesh>
  );
}

const vertexShaderSource = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionError";
  }
}

const getFragmentShaderSource = (
  expression: BoxedExpression,
  varValues: Record<string, number>
) => {
  return `
  varying vec2 vUv;

  uniform vec2 u_vmin;
  uniform vec2 u_vmax;
  ${Object.entries(varValues)
    .map(([name, value]) => `uniform float ${name};`)
    .join("\n")}

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    vec2 pos = mix(u_vmin, u_vmax, vUv);
    float value = ${nodeToGL(expression.json)};

    pos.x += 0.0001;
    float rightValue = ${nodeToGL(expression.json)};
    pos.x -= 0.0002;
    float leftValue = ${nodeToGL(expression.json)};
    pos.x += 0.0001;

    pos.y += 0.0001;
    float topValue = ${nodeToGL(expression.json)};
    pos.y -= 0.0002;
    float bottomValue = ${nodeToGL(expression.json)};
    pos.y += 0.0001;

    float xDiffMath = 0.0002;
    float yDiffMath = 0.0002;
    float xDiffScreen = xDiffMath / abs(u_vmax.x - u_vmin.x);
    float yDiffScreen = yDiffMath / abs(u_vmax.y - u_vmin.y);

    vec2 gradient = vec2(
      (rightValue - leftValue) / xDiffScreen,
      (topValue - bottomValue) / yDiffScreen
    );
    float d = max(abs(gradient.x), abs(gradient.y));

    float saturation = 1.0 / (0.00000005 * pow(d, 3.0) + 1.0);
    // float saturation = 1.0;

    float grayWaveValue = sin(700.0 * dot(vUv - vec2(0.5, 0.5), normalize(gradient)) * 3.141592653589);
    // float lightness = 0.5 + (0.4 * grayWaveValue) * (1.0 - saturation);
    float lightness = 0.5;

    gl_FragColor = vec4(hsl2rgb(vec3(value, saturation, lightness)), 1.0);
  }
`;
};

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
        if (symbol.length === 1) {
          return symbol; // Variable (use uniform value)
        }
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
      case "Arcsin":
        return `asin(${args[0]})`;
      case "Arccos":
        return `acos(${args[0]})`;
      case "Arctan":
        return `atan(${args[0]})`;
      case "Arctan2":
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
      case "Delimiter":
        return `(${args[0]})`;
    }

    throw new Error(`Unsupported function: ${name}`);
  };

  if (Array.isArray(node)) {
    const fnName = node[0];
    if (typeof fnName !== "string") {
      throw new Error(`Unsupported function name: ${fnName}`);
    }
    if (fnName === "Error") {
      throw new ExpressionError("Expression contains error");
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
      throw new ExpressionError("Expression contains error");
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
