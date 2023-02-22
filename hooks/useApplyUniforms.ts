import { useFrame } from "@react-three/fiber";
import { RefObject } from "react";
import { ShaderMaterial } from "three";

export function useApplyUniforms(
  ref: RefObject<ShaderMaterial>,
  uniforms: { [key: string]: any }
) {
  useFrame(() => {
    Object.keys(uniforms).forEach((name) => {
      if (!(name in ref.current!.uniforms)) {
        ref.current!.uniforms[name] = { value: uniforms[name] };
      } else {
        ref.current!.uniforms[name].value = uniforms[name];
      }
    });
  });
}
