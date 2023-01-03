import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexProps {
  value: string;
  displayMode?: boolean;
  trust?: boolean;
}

export function Latex({
  value,
  displayMode = false,
  trust = false,
}: LatexProps) {
  return (
    <span
      className={displayMode ? "block" : "inline"}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(value, { displayMode, trust }),
      }}
    />
  );
}
