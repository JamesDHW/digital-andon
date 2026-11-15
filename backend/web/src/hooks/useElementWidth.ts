import { useEffect, useRef, useState, type RefObject } from "react";

/** The width of an element, kept up to date as the window resizes, so the chart can draw at full width. */
export const useElementWidth = <Element extends HTMLElement>(): { readonly ref: RefObject<Element | null>; readonly width: number } => {
  const ref = useRef<Element | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return undefined;
    const observer = new ResizeObserver((entries) => setWidth(entries[0]?.contentRect.width ?? 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
};
