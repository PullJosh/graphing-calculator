import { Billboard, Text } from "@react-three/drei";
import { Color, Vector3 } from "three";

const CMUSerif = new URL(
  "katex/dist/fonts/KaTeX_Math-Italic.woff",
  import.meta.url
);

interface GraphText3DProps {
  children: string;
  position?: Vector3;
  font?: "sans-serif" | "math";
  fontSize?: number;
  color?: Color | string;
  opacity?: number;
}

export function GraphText3D({
  children,
  position = new Vector3(0, 0, 0),
  font = "math",
  fontSize = 0.1,
  color = "black",
  opacity = 1,
}: GraphText3DProps) {
  return (
    <Billboard follow={true} position={position}>
      <Text
        font={font === "math" ? CMUSerif.href : undefined}
        fontSize={fontSize}
        color={color}
        fillOpacity={opacity}
      >
        {children}
      </Text>
    </Billboard>
  );
}
