import { useEffect, useRef, useState } from "react";

import * as Mathlive from "mathlive";
import "mathlive/dist/mathlive-fonts.css";

import { ComputeEngine } from "@cortex-js/compute-engine";
import classNames from "classnames";
const ce = new ComputeEngine();

interface MathLiveInputProps {
  latex: string;
  onChange: (latex: string) => void;
  options?: Partial<Mathlive.MathfieldOptions>;
  className?: string;
  style?: string;
  wrapperDivClassName?: string;
  wrapperDivStyle?: React.CSSProperties;
}

export function MathLiveInput({
  latex,
  onChange,
  options = {},
  className,
  style,
  wrapperDivClassName,
  wrapperDivStyle,
}: MathLiveInputProps) {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);

  const mathFieldElement = useRef<Mathlive.MathfieldElement | null>(null);
  useEffect(() => {
    if (!div) return;

    if (!mathFieldElement.current) {
      mathFieldElement.current = new Mathlive.MathfieldElement(options);
      mathFieldElement.current.setValue(latex);
      mathFieldElement.current.className = className ?? "";
      mathFieldElement.current.style.cssText = style ?? "";
      div.appendChild(mathFieldElement.current);
    }

    const elem = mathFieldElement.current!;
    elem.setOptions(options);
    mathFieldElement.current.className = classNames(
      "cursor-text",
      className ?? ""
    );
    mathFieldElement.current.style.cssText = style ?? "";
    elem.oninput = () => onChange(elem.getValue("latex"));
  }, [div, options, className, style, onChange, latex]);

  useEffect(() => {
    const elem = mathFieldElement.current;
    if (!elem) return;

    if (elem.getValue("latex") !== latex) {
      elem.setValue(latex);
    }
  }, [latex]);

  return (
    <div
      ref={setDiv}
      className={wrapperDivClassName}
      style={wrapperDivStyle}
      onDoubleClick={() => {
        const latex = mathFieldElement.current?.getValue("latex");
        if (latex) {
          const mathJSON = ce.parse(latex);
          console.log(mathJSON.json);
        } else {
          console.warn("Could not get latex for input");
        }
      }}
    />
  );
}
