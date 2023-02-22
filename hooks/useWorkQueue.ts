import { useEffect, useRef, useState } from "react";
import deepEqual from "deep-equal";

export function useWorkQueue<A extends any[], T>(
  work: (...args: A) => Promise<T>,
  args: A,
  defaultValue: T,
  timeoutDuration = 1000
) {
  const busy = useRef(false);
  const queued = useRef<A | null>(null);
  const [result, setResult] = useState<T>(defaultValue);
  const [resultArgs, setResultArgs] = useState<A | null>(null);

  useEffect(() => {
    // If we've already calculated the result for these args, don't do anything
    if (deepEqual(args, resultArgs)) {
      return;
    }

    // If the work is already in progress, queue it up to run after the current
    if (busy.current) {
      queued.current = [...args] as A;
      return;
    }

    // Otherwise, start the work
    busy.current = true;
    performWork(...args).then(() => {
      busy.current = false;
    });

    async function performWork(...args: A) {
      try {
        console.log("Performing work", args, resultArgs);
        const timeout = new Promise<T>((resolve) =>
          setTimeout(() => resolve(defaultValue), timeoutDuration)
        );
        const newResult = await Promise.race([work(...args), timeout]);
        setResult(newResult);
        setResultArgs(args);
      } catch (err) {
        // console.error(err);
        setResult(defaultValue);
        setResultArgs(args);
      } finally {
        if (queued.current) {
          const args = queued.current;
          queued.current = null;
          await performWork(...args);
        }
      }
    }
  }, [busy, args, defaultValue, timeoutDuration, work, resultArgs]);

  return result;
}
