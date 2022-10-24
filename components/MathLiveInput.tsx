import { useEffect, useRef, useState } from "react";

import * as Mathlive from "mathlive";
import "mathlive/dist/mathlive-fonts.css";

interface MathLiveInputProps {
  latex: string;
  onChange: (latex: string) => void;
  options?: Partial<Mathlive.MathfieldOptions>;
}

export function MathLiveInput({
  latex,
  onChange,
  options = {},
}: MathLiveInputProps) {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);

  const mathFieldElement = useRef<Mathlive.MathfieldElement | null>(null);
  useEffect(() => {
    if (!div) return;

    if (!mathFieldElement.current) {
      mathFieldElement.current = new Mathlive.MathfieldElement(options);
      mathFieldElement.current.setValue(latex);
      div.appendChild(mathFieldElement.current);
    }

    const elem = mathFieldElement.current!;
    elem.setOptions(options);
    elem.oninput = () => onChange(elem.getValue("latex"));
  }, [div, options, onChange, latex]);

  useEffect(() => {
    const elem = mathFieldElement.current;
    if (!elem) return;

    if (elem.getValue("latex") !== latex) {
      elem.setValue(latex);
    }
  }, [latex]);

  return <div ref={setDiv} />;
}
