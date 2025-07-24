import { RefObject, useEffect, useRef } from "react";

export function useOnClickOutside<T extends HTMLElement>(
  node: RefObject<T | undefined> | RefObject<T | undefined>[],
  handler: undefined | (() => void)
) {
  const handlerRef = useRef<undefined | (() => void)>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      let nodes: RefObject<T | undefined>[];
      if (
        [
          ...document.getElementsByClassName("setting"),
          ...document.getElementsByClassName("pcs-lw-modal-overlay"),
        ].some((el: Element) => el.contains(e.target as Node))
      ) {
        return;
      }
      if (
        [...document.getElementsByTagName("kyber-portal")].some((el: Element) =>
          el.contains(e.target as Node)
        )
      ) {
        return;
      }
      if (Array.isArray(node)) nodes = node;
      else nodes = [node];
      if (
        nodes.some((node) => node.current?.contains(e.target as Node) ?? false)
      ) {
        return;
      }
      handlerRef.current?.();
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [node]);
}
