import {
  ScaleLinear,
  select,
  zoom,
  ZoomBehavior,
  zoomIdentity,
  ZoomTransform,
} from "d3";
import { useEffect, useMemo, useRef } from "react";
import RefreshIcon from "@/assets/svg/ic_refresh.svg";

import { ZoomLevels } from "../types";

export default function Zoom({
  svg,
  xScale,
  setZoom,
  width,
  height,
  resetBrush,
  showResetButton,
  zoomLevels,
}: {
  svg: SVGElement | null;
  xScale: ScaleLinear<number, number>;
  setZoom: (transform: ZoomTransform) => void;
  width: number;
  height: number;
  resetBrush: () => void;
  showResetButton: boolean;
  zoomLevels: ZoomLevels;
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>();

  const [zoomIn, zoomOut, zoomInitial, zoomReset] = useMemo(
    () => [
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 2),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .call(
            zoomBehavior.current.transform,
            zoomIdentity.translate(0, 0).scale(1)
          )
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
    ],
    [svg]
  );

  useEffect(() => {
    if (!svg) return;

    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", ({ transform }: { transform: ZoomTransform }) =>
        setZoom(transform)
      );

    select(svg as Element).call(zoomBehavior.current);
  }, [height, width, setZoom, svg, xScale, zoomBehavior, zoomLevels]);

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial();
  }, [zoomInitial, zoomLevels]);

  return (
    <div
      className={`grid gap-[6px] absolute -top-[18px] right-0 ${
        showResetButton ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
      {showResetButton && (
        <div
          className="cursor-pointer"
          onClick={() => {
            resetBrush();
            zoomReset();
          }}
        >
          <RefreshIcon className="relative -top-[1px]" width={18} height={18} />
        </div>
      )}
      <div className="cursor-pointer" onClick={zoomIn}>
        <svg
          width="24"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.52 11H11.73L11.45 10.73C12.43 9.59 13.02 8.11 13.02 6.5C13.02 2.91 10.11 0 6.52002 0C2.93002 0 0.0200195 2.91 0.0200195 6.5C0.0200195 10.09 2.93002 13 6.52002 13C8.13002 13 9.61002 12.41 10.75 11.43L11.02 11.71V12.5L16.02 17.49L17.51 16L12.52 11ZM6.52002 11C4.03002 11 2.02002 8.99 2.02002 6.5C2.02002 4.01 4.03002 2 6.52002 2C9.01002 2 11.02 4.01 11.02 6.5C11.02 8.99 9.01002 11 6.52002 11ZM7.02002 4H6.02002V6H4.02002V7H6.02002V9H7.02002V7H9.02002V6H7.02002V4Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="cursor-pointer" onClick={zoomOut}>
        <svg
          width="24"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.01 11h-.79l-.28-.27a6.471 6.471 0 001.57-4.23 6.5 6.5 0 10-6.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L18 16l-4.99-5zm-6 0c-2.49 0-4.5-2.01-4.5-4.5S4.52 2 7.01 2s4.5 2.01 4.5 4.5S9.5 11 7.01 11zm-2.5-5h5v1h-5V6z"
            fill="currentColor"
          ></path>
        </svg>{" "}
      </div>
    </div>
  );
}
