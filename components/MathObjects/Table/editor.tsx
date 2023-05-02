import { useRef } from "react";
import type { ObjectDescription } from "./spec";
import { ContentEditorProps } from "..";

export function ContentEditor({
  obj,
  setObj,
}: ContentEditorProps<ObjectDescription>) {
  const { values } = obj;

  const setValues = (newValues: ObjectDescription["values"]) => {
    setObj({ ...obj, values: newValues });
  };

  const setValue = (row: number, column: number, value: number) => {
    const oldRow = values[row];

    setValues([
      ...values.slice(0, row),
      [...oldRow.slice(0, column), value, ...oldRow.slice(column + 1)],
      ...values.slice(row + 1),
    ]);
  };

  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const addRow = (newFocusIndex = 0) => {
    setValues([...values, [0, 0, 0]]);

    setTimeout(() => {
      tbodyRef.current
        ?.querySelector("tr:last-of-type")
        ?.querySelectorAll("td")
        [newFocusIndex]?.querySelector("input")
        ?.focus();
    }, 0);
  };

  const deleteRow = (index: number) => {
    setValues([...values.slice(0, index), ...values.slice(index + 1)]);
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>x</th>
            <th>y</th>
            <th>z</th>
            <th>{/* Delete */}</th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {values.map((row, rowNumber) => (
            <tr key={rowNumber}>
              {row.map((value, colNumber) => (
                <td key={colNumber}>
                  <input
                    className="w-full text-center"
                    type="number"
                    value={value}
                    onChange={(event) =>
                      setValue(rowNumber, colNumber, event.target.valueAsNumber)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const nextInput =
                          event.currentTarget.parentElement?.parentElement?.nextElementSibling?.querySelectorAll(
                            "input"
                          )[colNumber];
                        if (nextInput) {
                          nextInput.focus();
                        } else {
                          addRow(colNumber);
                        }
                      }
                      if (event.key === "Backspace" && isNaN(value)) {
                        const prevInput =
                          event.currentTarget?.parentElement?.previousElementSibling?.querySelector(
                            "input"
                          );
                        if (prevInput) {
                          prevInput.focus();
                        }
                      }
                    }}
                  />
                </td>
              ))}
              <button onClick={() => deleteRow(rowNumber)}>Delete</button>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => addRow()}>Add row</button>
    </>
  );
}

interface SettingsEditorProps {
  obj: ObjectDescription;
  setObj: (obj: ObjectDescription) => void;
}

export function SettingsEditor({ obj, setObj }: SettingsEditorProps) {
  return <></>;
}
