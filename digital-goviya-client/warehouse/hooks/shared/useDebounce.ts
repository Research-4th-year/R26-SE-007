import { useRef, useCallback } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay = 500
): T {
  const lastCall = useRef<number>(0);
  const timeout  = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current < delay) return;
    lastCall.current = now;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => fn(...args), 0);
  }, [fn, delay]) as T;
}