import { useEffect, useState } from "react";

export function useWindowSize(): number {
  const [width, setWidth] = useState<number>(window.innerWidth);

  const handleResize = (): void => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return width;
}
