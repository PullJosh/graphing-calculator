import { useState, useEffect } from "react";

import "mathquill/build/mathquill.css";

import dynamic from "next/dynamic";
const StaticMathField = dynamic(
  () => import("react-mathquill").then((mod) => mod.StaticMathField),
  { ssr: false }
);

interface MathQuillInputProps {
  defaultValue: string;
  onChange: (value: string) => void;
}

export function MathQuillInput({
  defaultValue,
  onChange,
}: MathQuillInputProps) {
  const [originalDefaultValue] = useState(defaultValue);
  const [mathfield, setMathField] = useState<any>(null);

  useEffect(() => {
    if (mathfield) {
      mathfield.innerFields[0].config({
        handlers: {
          edit: function (field: any) {
            const value = field.latex();
            if (onChange) {
              onChange(value);
            }
          },
        },
      });
    }
  }, [mathfield, onChange]);

  return (
    <StaticMathField
      mathquillDidMount={(mathfield) => {
        setMathField(mathfield);
      }}
    >
      {String.raw`\MathQuillMathField{${originalDefaultValue}}`}
    </StaticMathField>
  );
}
