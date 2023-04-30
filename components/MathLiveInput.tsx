import {
  useEffect,
  useRef,
  useState,
  DOMAttributes,
  useLayoutEffect,
  useCallback,
} from "react";
import * as Mathlive from "mathlive";
import classNames from "classnames";

import { BoxedExpression, ComputeEngine } from "@cortex-js/compute-engine";

const ce = new ComputeEngine();

import type { MathfieldElement, MathfieldElementAttributes } from "mathlive";
import { CSSProperties } from "react";

type CustomElement<T> = Partial<T & DOMAttributes<T>>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["math-field"]: CustomElement<MathfieldElementAttributes>;
    }
  }
}

Mathlive.MathfieldElement.fontsDirectory = "/mathlive/fonts";
Mathlive.MathfieldElement.soundsDirectory = "/mathlive/sounds";

interface MathLiveInputProps {
  latex: string;
  onChange: (latex: string) => void;
  onBlur?: (mathJSON: BoxedExpression, latex: string) => void;
  className?: string;
  style?: string;
  wrapperDivClassName?: string;
  wrapperDivStyle?: React.CSSProperties;
}

export function MathLiveInput({
  latex,
  onChange,
  onBlur: onBlurProp,
  className,
  style,
  wrapperDivClassName,
  wrapperDivStyle,
}: MathLiveInputProps) {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);
  const mathfieldRef = useRef<MathfieldElement | null>(null);

  const onInput = useCallback(() => {
    onChange(mathfieldRef.current!.getValue("latex"));
  }, [onChange]);

  const onBlur = useCallback(() => {
    const latex = mathfieldRef.current!.getValue("latex");
    const mathJSON = ce.parse(latex);
    onBlurProp?.(mathJSON, latex);
  }, [onBlurProp]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Spacebar" || e.key === " ") {
      console.log("space!");
      mathfieldRef.current?.applyStyle({
        color: "red",
      });
    }
  }, []);

  const onDoubleClick = useCallback(() => {
    const latex = mathfieldRef.current?.getValue("latex");
    if (latex) {
      const mathJSON = ce.parse(latex);
      console.log(latex, mathJSON.json);
    } else {
      console.warn("Could not get latex for input");
    }
  }, []);

  useLayoutEffect(() => {
    if (!div) return;
    if (mathfieldRef.current) return;

    const elem = new Mathlive.MathfieldElement();
    mathfieldRef.current = elem;

    elem.onExport = (from, latex) => latex;
    elem.setValue(latex);

    elem.className = classNames("cursor-text", className ?? "");
    elem.style.cssText = style ?? "";

    elem.addEventListener("input", onInput);
    elem.addEventListener("blur", onBlur);
    elem.addEventListener("keydown", onKeyDown);
    elem.addEventListener("dblclick", onDoubleClick);

    div.appendChild(elem);
  }, [div]);

  useEffect(() => {
    const elem = mathfieldRef.current;
    if (!elem) return;

    elem.addEventListener("input", onInput);
    elem.addEventListener("blur", onBlur);
    elem.addEventListener("keydown", onKeyDown);
    elem.addEventListener("dblclick", onDoubleClick);

    return () => {
      elem.removeEventListener("input", onInput);
      elem.removeEventListener("blur", onBlur);
      elem.removeEventListener("keydown", onKeyDown);
      elem.removeEventListener("dblclick", onDoubleClick);
    };
  }, [onBlur, onDoubleClick, onInput, onKeyDown]);

  useEffect(() => {
    const elem = mathfieldRef.current;
    if (!elem) return;

    elem.className = classNames("cursor-text", className ?? "");
    elem.style.cssText = style ?? "";
  }, [className, style]);

  // Sync `latex` prop with mathfield
  useEffect(() => {
    const elem = mathfieldRef.current;
    if (!elem) return;

    if (elem.getValue("latex") !== latex) {
      elem.setValue(latex);
    }
  }, [latex]);

  return (
    <>
      <div
        ref={setDiv}
        className={wrapperDivClassName}
        style={wrapperDivStyle}
      />
      <style jsx global>
        {`
          @media not (pointer: coarse) {
            math-field::part(virtual-keyboard-toggle) {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}

/*
<math-field
  ref={mathfieldRef}
  class={classNames("cursor-text", className ?? "")}
  style={style}
  onInput={() => {
    onChange(mathfieldRef.current!.getValue("latex"));
  }}
  onBlur={() => {
    const latex = mathfieldRef.current!.getValue("latex");
    const mathJSON = ce.parse(latex);
    onBlur?.(mathJSON, latex);
  }}
  onKeyDown={(e) => {
    if (e.key === "Spacebar" || e.key === " ") {
      console.log("space!");
      mathfieldRef.current?.applyStyle({
        color: "red",
      });
    }
  }}
  onDoubleClick={() => {
    const latex = mathfieldRef.current?.getValue("latex");
    if (latex) {
      const mathJSON = ce.parse(latex);
      console.log(latex, mathJSON.json);
    } else {
      console.warn("Could not get latex for input");
    }
  }}
>
  {latex}
</math-field>
*/
