import { ShaderMaterialProps } from "@react-three/fiber";
import { useRef } from "react";
import { Color, DoubleSide, ShaderMaterial } from "three";
import { useApplyUniforms } from "../../hooks/useApplyUniforms";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";

interface GraphSurfaceGridMaterialProps extends ShaderMaterialProps {
  color: "red" | "blue";
  opacity?: number;
  divisionScale?: number;
}

export function GraphSurfaceGridMaterial({
  opacity = 1,
  divisionScale = 1,
  color,
  ...props
}: GraphSurfaceGridMaterialProps) {
  const ref = useRef<ShaderMaterial>(null);

  const lightColors = {
    blue: new Color(37 / 255, 99 / 255, 235 / 255),
    red: new Color(220 / 255, 38 / 255, 38 / 255),
  };

  const darkColors = {
    blue: new Color(29 / 255, 79 / 255, 216 / 255),
    red: new Color(185 / 255, 28 / 255, 28 / 255),
  };

  const lightColor = lightColors[color];
  const darkColor = darkColors[color];

  useApplyUniforms(ref, { lightColor, darkColor, opacity, divisionScale });

  const clippingPlanes = useClippingPlanes();

  return (
    <shaderMaterial
      attach="material"
      ref={ref}
      vertexShader={vertexShaderSource}
      fragmentShader={fragmentShaderSource}
      side={DoubleSide}
      transparent={false}
      clipping={true}
      clippingPlanes={clippingPlanes}
      {...props}
    />
  );
}

const vertexShaderSource = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;

  #include <clipping_planes_pars_vertex>

  void main() {
    #include <begin_vertex>
    
    vUv = uv;
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    #include <project_vertex>
    #include <clipping_planes_vertex>
  }
`;

const fragmentShaderSource = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;

  uniform vec2 u_vmin;
  uniform vec2 u_vmax;

  uniform float divisionScale;
  uniform float opacity;

  uniform vec3 lightColor;
  uniform vec3 darkColor;

  #define PI 3.1415926535897932384626433832795

  #include <clipping_planes_pars_fragment>

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    #include <clipping_planes_fragment>

    // float value = pow(abs(cos(PI * vPos.x / divisionScale)), 1000.0) * (1.0 - pow(abs(dot(vNormal, vec3(1.0, 0.0, 0.0))), 10.0))
    //             + pow(abs(cos(PI * vPos.y / divisionScale)), 1000.0) * (1.0 - pow(abs(dot(vNormal, vec3(0.0, 1.0, 0.0))), 10.0))
    //             + pow(abs(cos(PI * vPos.z / divisionScale)), 1000.0) * (1.0 - pow(abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 10.0));

    float value = 0.0;
    const float threshold = 0.02;
    if (0.5 - abs(fract(vPos.x / divisionScale) - 0.5) < threshold * abs(sin(acos(dot(vNormal, vec3(1.0, 0.0, 0.0)))))) {
      value = 1.0;
    }
    if (0.5 - abs(fract(vPos.y / divisionScale) - 0.5) < threshold * abs(sin(acos(dot(vNormal, vec3(0.0, 1.0, 0.0)))))) {
      value = 1.0;
    }
    if (0.5 - abs(fract(vPos.z / divisionScale) - 0.5) < threshold * abs(sin(acos(dot(vNormal, vec3(0.0, 0.0, 1.0)))))) {
      value = 1.0;
    }

    vec3 color = mix(lightColor, darkColor, value);
    // vec3 color = mix(vec3(37.0 / 255.0, 99.0 / 255.0, 235.0 / 255.0), darkColor, 0.0);

    // float fadeOut = smoothstep(4.5, 5.0, length(vPos.y));
    float fadeOut = 0.0;

    gl_FragColor = vec4(color, (1.0 - fadeOut) * opacity);
  }
`;
