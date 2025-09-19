import { RefObject, useEffect, useRef } from 'react';

export const useOnClickOutside = <T extends HTMLElement>(
  node: RefObject<T | undefined> | RefObject<T | undefined>[],
  handler: undefined | (() => void),
  classNames: string[],
) => {
  const handlerRef = useRef<undefined | (() => void)>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      let nodes: RefObject<T | undefined>[];
      if (
        [...classNames.flatMap(className => Array.from(document.getElementsByClassName(className)))].some(
          (el: Element) => el.contains(e.target as Node),
        )
      )
        return;

      if (Array.isArray(node)) nodes = node;
      else nodes = [node];

      if (nodes.some(node => node.current?.contains(e.target as Node) ?? false)) return;
      handlerRef.current?.();
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [node, classNames]);
};
