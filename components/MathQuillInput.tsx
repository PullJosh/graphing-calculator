import { useEffect, useLayoutEffect, useRef } from "react";
import "../mathquill-0.10.1/mathquill";
import classNames from "classnames";

interface MathQuillInputProps {
  latex: string;
  onChange: (latex: string) => void;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: string;
}

const MQ = (window as any).MathQuill.getInterface(2);

export function MathQuillInput({
  latex,
  onChange,
  className,
  style,
  fontSize,
}: MathQuillInputProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mathfieldRef = useRef<any | null>(null);

  const onChangeRef = useRef<typeof onChange>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize MathQuill on first render
  useEffect(() => {
    if (!divRef.current) return;
    if (mathfieldRef.current) return;

    const mathField = MQ.MathField(divRef.current, {
      handlers: {
        edit: function () {
          onChangeRef.current(mathfieldRef.current.latex());
        },
      },
      restrictMismatchedBrackets: true,
      charsThatBreakOutOfSupSub: "+-=<>",
      autoCommands: "pi theta sqrt sum",
      autoOperatorNames: "sin cos",
    });

    mathfieldRef.current = mathField;

    mathField.latex(latex);
  }, []);

  // Update MathQuill on latex change
  useEffect(() => {
    if (!mathfieldRef.current) return;
    if (mathfieldRef.current.latex() === latex) return;
    mathfieldRef.current.latex(latex);
  }, [latex]);

  return (
    <>
      <div
        ref={divRef}
        className={classNames(
          "!border-none !shadow-none",
          className,
          "mq-editable-field mq-math-mode"
        )}
        style={style}
      />
      {fontSize && (
        <style jsx>
          {`
            :global(.mq-root-block) {
              font-size: ${fontSize} !important;
            }
          `}
        </style>
      )}
    </>
  );
}
