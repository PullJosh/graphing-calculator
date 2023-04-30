import { useContext, useEffect, useMemo, useRef } from "react";
import { BoxedExpression, ComputeEngine } from "@cortex-js/compute-engine";
import { DoubleSide, ShaderMaterial, Vector2 } from "three";
import { Graph3DContext } from "./Graph3D";
import { useApplyUniforms } from "../../hooks/useApplyUniforms";
const ce = new ComputeEngine();

interface GraphComplexExpression3DProps {
  expression: string;
  varValues?: Record<string, number>;
}

export function GraphComplexExpression3D({
  expression,
  varValues: additionalVarValues = {},
}: GraphComplexExpression3DProps) {
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

  #define PI 3.1415926535897932384626433832795

  // vec3 hsv2rgb(vec3 c) {
  //   vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  //   vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  //   return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  // }

  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  // vec3 hsl2rgb(vec3 c) {
  //   vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
  //   return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  // }

  vec2 complex_add(vec2 a, vec2 b) {
    return a + b;
  }

  vec2 complex_sub(vec2 a, vec2 b) {
    return a - b;
  }

  vec2 complex_mult(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }

  vec2 complex_div(vec2 a, vec2 b) {
    float denom = dot(b, b);
    return vec2(
      (a.x * b.x + a.y * b.y) / denom,
      (a.y * b.x - a.x * b.y) / denom
    );
  }

  vec2 complex_exp(vec2 a) {
    float r = exp(a.x);
    return vec2(r * cos(a.y), r * sin(a.y));
  }

  vec2 complex_log(vec2 a) {
    return vec2(0.5 * log(dot(a, a)), atan(a.y, a.x));
  }

  vec2 complex_pow(vec2 a, vec2 b) {
    return complex_exp(complex_mult(complex_log(a), b));
  }

  vec2 complex_logbase(vec2 a, vec2 b) {
    return complex_div(complex_log(a), complex_log(b));
  }

  vec2 complex_sqrt(vec2 a) {
    float r = length(a);
    float theta = atan(a.y, a.x);
    return vec2(sqrt(r) * cos(theta / 2.0), sqrt(r) * sin(theta / 2.0));
  }

  vec2 complex_sin(vec2 a) {
    return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }

  vec2 complex_cos(vec2 a) {
    return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }

  vec2 complex_tan(vec2 a) {
    return complex_div(complex_sin(a), complex_cos(a));
  }

  vec2 complex_sinh(vec2 a) {
    return vec2(sinh(a.x) * cos(a.y), cosh(a.x) * sin(a.y));
  }

  vec2 complex_cosh(vec2 a) {
    return vec2(cosh(a.x) * cos(a.y), sinh(a.x) * sin(a.y));
  }

  vec2 complex_tanh(vec2 a) {
    return complex_div(complex_sinh(a), complex_cosh(a));
  }

  vec2 complex_asin(vec2 a) {
    return complex_mult(complex_log(complex_mult(vec2(0.0, 1.0), a)), vec2(0.0, -1.0));
  }

  vec2 complex_acos(vec2 a) {
    return complex_mult(complex_log(complex_add(a, complex_mult(vec2(0.0, 1.0), complex_sqrt(complex_sub(vec2(1.0, 0.0), complex_pow(a, vec2(2.0, 0.0))))))), vec2(0.0, -1.0));
  }

  vec2 complex_atan(vec2 a) {
    return complex_mult(complex_log(complex_div(complex_add(vec2(0.0, 1.0), a), complex_sub(vec2(0.0, 1.0), a))), vec2(0.0, 0.5));
  }

  vec2 complex_asinh(vec2 a) {
    return complex_log(complex_add(a, complex_sqrt(complex_add(complex_pow(a, vec2(2.0, 0.0)), vec2(1.0, 0.0)))));
  }

  vec2 complex_acosh(vec2 a) {
    return complex_log(complex_add(a, complex_sqrt(complex_sub(complex_pow(a, vec2(2.0, 0.0)), vec2(1.0, 0.0)))));
  }

  vec2 complex_atanh(vec2 a) {
    return complex_mult(complex_log(complex_div(complex_add(vec2(1.0, 0.0), a), complex_sub(vec2(1.0, 0.0), a))), vec2(0.5, 0.0));
  }

  vec2 complex_csc(vec2 a) {
    return complex_div(vec2(1.0, 0.0), complex_sin(a));
  }

  vec2 complex_sec(vec2 a) {
    return complex_div(vec2(1.0, 0.0), complex_cos(a));
  }

  vec2 complex_cot(vec2 a) {
    return complex_div(vec2(1.0, 0.0), complex_tan(a));
  }

  vec2 complex_csch(vec2 a) {
    return complex_div(vec2(1.0, 0.0), complex_sinh(a));
  }

  vec2 complex_sech(vec2 a) {
    return complex_div(vec2(1.0, 0.0), complex_cosh(a));
  }

  vec2 complex_coth(vec2 a) {
    return complex_div(vec2(1.0, 0.0), complex_tanh(a));
  }

  vec2 complex_acsc(vec2 a) {
    return complex_asin(complex_div(vec2(1.0, 0.0), a));
  }

  vec2 complex_asec(vec2 a) {
    return complex_acos(complex_div(vec2(1.0, 0.0), a));
  }

  vec2 complex_acot(vec2 a) {
    return complex_atan(complex_div(vec2(1.0, 0.0), a));
  }

  vec2 complex_acsch(vec2 a) {
    return complex_asinh(complex_div(vec2(1.0, 0.0), a));
  }

  vec2 complex_asech(vec2 a) {
    return complex_acosh(complex_div(vec2(1.0, 0.0), a));
  }

  vec2 complex_acoth(vec2 a) {
    return complex_atanh(complex_div(vec2(1.0, 0.0), a));
  }

  vec2 complex_abs(vec2 a) {
    return vec2(length(a), 0.0);
  }

  vec2 complex_floor(vec2 a) {
    return vec2(floor(a.x), floor(a.y));
  }

  vec2 complex_ceil(vec2 a) {
    return vec2(ceil(a.x), ceil(a.y));
  }

  vec2 complex_round(vec2 a) {
    return vec2(round(a.x), round(a.y));
  }

  vec2 complex_trunc(vec2 a) {
    return vec2(trunc(a.x), trunc(a.y));
  }

  vec2 complex_frac(vec2 a) {
    return vec2(fract(a.x), fract(a.y));
  }

  vec2 complex_sign(vec2 a) {
    return vec2(sign(a.x), sign(a.y));
  }

  void main() {
    vec2 pos = mix(u_vmin, u_vmax, vUv);
    vec2 value = ${nodeToGL(expression.json)};

    float hue = (-atan(value.x, value.y) + 1.5 * PI / 3.0) / (2.0 * PI);
    float sat = 1.0;
    float lightness = 2.0 / PI * atan(length(value));

    gl_FragColor = vec4(hsl2rgb(vec3(hue, 1.0, lightness)), 1.0);

    if (isinf(value.x) || isnan(value.x) || isinf(value.y) || isnan(value.y)) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  }
`;
};

const nodeToGL = (node: BoxedExpression["json"]): string => {
  const symbolToGL = (symbol: string) => {
    switch (symbol) {
      case "z":
        return "pos";
      case "ImaginaryUnit":
        return "vec2(0.0, 1.0)";
      case "ExponentialE":
        return "vec2(2.718281828459045, 0.0)";
      case "MachineEpsilon":
        return `vec2(${Number.EPSILON.toPrecision(21)}, 0.0)`;
      case "CatalanConstant":
        return "vec2(0.915965594177219015054, 0.0)";
      case "GoldenRatio":
        return "vec2(1.618033988749894848204, 0.0)";
      case "EulerGamma":
        return "vec2(0.577215664901532860606, 0.0)";
      case "Degrees":
        return "vec2(57.295779513082320876798, 0.0)";
      case "Pi":
        return `vec2(${Math.PI.toPrecision(21)}, 0.0)`;
      default:
        if (symbol.length === 1) {
          return `vec2(${symbol}, 0.0)`; // Variable (use uniform value)
        }
        throw new Error(`Unsupported symbol: ${node}`);
    }
  };

  if (typeof node === "string") {
    return symbolToGL(node);
  }

  if (typeof node === "number") {
    return `vec2(${node.toPrecision(21)}, 0.0)`;
  }

  if ("sym" in node) {
    return symbolToGL(node.sym);
  }

  if ("num" in node) {
    switch (node.num) {
      case "NaN":
        throw new Error("NaN is not supported");
      case "Infinity":
        return "vec2(1.0 / 0.0, 0.0)";
      case "-Infinity":
        return "vec2(-1.0 / 0.0, 0.0)";
      default:
        try {
          return `vec2(${Number(node.num).toPrecision(21)}, 0.0)`;
        } catch (err) {
          throw new Error(`Unsupported number: ${node.num}`);
        }
    }
  }

  const functionToGL = (name: string, args: string[]) => {
    switch (name) {
      case "Add":
        return `complex_add(${args.join(", ")})`;
      case "Subtract":
        return `complex_sub(${args.join(", ")})`;
      case "Negate":
        return `(-${args[0]})`;
      case "Multiply":
        return `complex_mult(${args.join(", ")})`;
      case "Divide":
        return `complex_div(${args.join(", ")})`;
      case "Power":
        return `complex_pow(${args[0]}, ${args[1]})`;
      // case "Root":
      //   return `pow(${args[0]}, 1.0 / ${args[1]})`;
      case "Sqrt":
        return `complex_sqrt(${args[0]})`;
      case "Square":
        return `complex_mult(${args[0]}, ${args[0]})`;
      case "Exp":
        return `complex_exp(${args[0]})`;
      case "Ln":
        return `complex_log(${args[0]})`;
      case "Log":
        return `complex_logbase(${args[0]}, ${args[1] ?? "vec2(10.0, 0.0)"})`;
      case "Lb":
        return `complex_logbase(${args[0]}, vec2(2.0, 0.0))`;
      case "Lg":
        return `complex_logbase(${args[0]}, vec2(10.0, 0.0))`;
      case "Sin":
        return `complex_sin(${args[0]})`;
      case "Cos":
        return `complex_cos(${args[0]})`;
      case "Tan":
        return `complex_tan(${args[0]})`;
      case "Cot":
        return `complex_cot(${args[0]})`;
      case "Sec":
        return `complex_sec(${args[0]})`;
      case "Csc":
        return `complex_csc(${args[0]})`;
      case "Arcsin":
        return `complex_asin(${args[0]})`;
      case "Arccos":
        return `complex_acos(${args[0]})`;
      case "Arctan":
        return `complex_atan(${args[0]})`;
      // case "Arctan2":
      //   return `atan(${args[0]}, ${args[1]})`;
      case "Acot":
        return `complex_acot(${args[0]})`;
      case "Asec":
        return `complex_asec(${args[0]})`;
      case "Acsc":
        return `complex_acsc(${args[0]})`;
      case "Sinh":
        return `complex_sinh(${args[0]})`;
      case "Cosh":
        return `complex_cosh(${args[0]})`;
      case "Tanh":
        return `complex_tanh(${args[0]})`;
      case "Coth":
        return `complex_coth(${args[0]})`;
      case "Sech":
        return `complex_sech(${args[0]})`;
      case "Csch":
        return `complex_csch(${args[0]})`;
      case "Arsinh":
        return `complex_asinh(${args[0]})`;
      case "Arcosh":
        return `complex_acosh(${args[0]})`;
      case "Artanh":
        return `complex_atanh(${args[0]})`;
      case "Arcoth":
        return `complex_acoth(${args[0]})`;
      case "Asech":
        return `complex_asech(${args[0]})`;
      case "Acsch":
        return `complex_acsch(${args[0]})`;
      case "Abs":
        return `complex_abs(${args[0]})`;
      case "Ceil":
        return `complex_ceil(${args[0]})`;
      case "Floor":
        return `complex_floor(${args[0]})`;
      case "Round":
        return `complex_round(${args[0]})`;
      // case "Clamp":
      //   return `clamp(${args[0]}, ${args[1] ?? "-1"}, ${args[2] ?? "1"})`;
      // case "Max":
      //   return `max(${args.join(", ")})`;
      // case "Min":
      //   return `min(${args.join(", ")})`;
      case "Rational":
        return `complex_div(${args[0]}, ${args[1] ?? "vec2(1.0, 0.0)"})`;
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
