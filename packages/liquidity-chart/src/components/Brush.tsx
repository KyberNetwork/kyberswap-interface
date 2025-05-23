import type { BrushBehavior, D3BrushEvent } from "d3";
import { brushX, select } from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brushHandlePath, OffScreenHandle } from "@/components/svg";
import { compare } from "@/utils";
import type { BrushProps } from "@/types";
import usePreviousValue from "@/hooks/usePreviousValue";

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 20;

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 2;

export default function Brush({
  id,
  xScale,
  brushExtent,
  innerWidth,
  innerHeight,
  zoomInited,
  alwaysShowLabel,
  brushLabelValue,
  setBrushExtent,
}: BrushProps) {
  const brushRef = useRef<SVGGElement | null>(null);
  const brushBehavior = useRef<BrushBehavior<SVGGElement> | null>(null);

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<
    [number, number] | null
  >(brushExtent);
  const [showLabels, setShowLabels] = useState(true);
  const [hovering, setHovering] = useState(false);

  const previousBrushExtent = usePreviousValue(brushExtent);

  const brushed = useCallback(
    (event: D3BrushEvent<unknown>) => {
      const { type, selection, mode } = event;

      if (!selection) {
        setLocalBrushExtent(null);
        return;
      }

      const scaled = (selection as [number, number]).map(xScale.invert) as [
        number,
        number
      ];

      // avoid infinite render loop by checking for change
      if (
        type === "end" &&
        !compare(brushExtent, scaled, xScale) &&
        zoomInited &&
        setBrushExtent
      ) {
        setBrushExtent(scaled, mode);
      }

      setLocalBrushExtent(scaled);
    },
    [xScale, brushExtent, setBrushExtent, zoomInited]
  );

  // keep local and external brush extent in sync
  // i.e. snap to ticks on bruhs end
  useEffect(() => {
    setLocalBrushExtent(brushExtent);
  }, [brushExtent]);

  // initialize the brush
  useEffect(() => {
    if (!brushRef.current) return;

    brushBehavior.current = brushX<SVGGElement>()
      .extent([
        [Math.max(0 + BRUSH_EXTENT_MARGIN_PX, xScale(0)), 0],
        [innerWidth - BRUSH_EXTENT_MARGIN_PX, innerHeight],
      ])
      .handleSize(30)
      .on("brush end", brushed);

    brushBehavior.current(select(brushRef.current));

    if (
      previousBrushExtent &&
      previousBrushExtent &&
      Array.isArray(previousBrushExtent) &&
      compare(brushExtent, previousBrushExtent as [number, number], xScale)
    ) {
      select(brushRef.current)
        .transition()
        .call(brushBehavior.current.move as any, brushExtent.map(xScale));
    }

    // brush linear gradient
    if (!setBrushExtent) {
      select(brushRef.current)
        .selectAll(".selection")
        .attr("stroke", "none")
        .attr("fill-opacity", "0.1")
        .attr("fill", `url(#${id}-gradient-selection)`)
        .attr("cursor", "default");
      select(brushRef.current).selectAll(".overlay").attr("cursor", "default");
      select(brushRef.current).selectAll(".handle").attr("cursor", "default");
    } else {
      select(brushRef.current)
        .selectAll(".selection")
        .attr("stroke", "none")
        .attr("fill-opacity", "0.1")
        .attr("fill", `url(#${id}-gradient-selection)`);
    }
  }, [
    brushExtent,
    brushed,
    id,
    innerHeight,
    innerWidth,
    previousBrushExtent,
    setBrushExtent,
    xScale,
  ]);

  // respond to xScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) return;

    brushBehavior.current.move(
      select(brushRef.current),
      brushExtent.map(xScale) as [number, number]
    );
  }, [brushExtent, xScale]);

  // show labels when local brush changes
  useEffect(() => {
    setShowLabels(true);
    const timeout = setTimeout(() => setShowLabels(false), 1500);
    return () => clearTimeout(timeout);
  }, [localBrushExtent]);

  // variables to help render the SVGs
  const flipWestHandle =
    localBrushExtent && xScale(localBrushExtent[0]) > FLIP_HANDLE_THRESHOLD_PX;
  const flipEastHandle =
    localBrushExtent &&
    xScale(localBrushExtent[1]) > innerWidth - FLIP_HANDLE_THRESHOLD_PX;

  const showWestArrow =
    localBrushExtent &&
    (xScale(localBrushExtent[0]) < 0 || xScale(localBrushExtent[1]) < 0);
  const showEastArrow =
    localBrushExtent &&
    (xScale(localBrushExtent[0]) > innerWidth ||
      xScale(localBrushExtent[1]) > innerWidth);

  const westHandleInView =
    localBrushExtent &&
    xScale(localBrushExtent[0]) >= 0 &&
    xScale(localBrushExtent[0]) <= innerWidth;
  const eastHandleInView =
    localBrushExtent &&
    xScale(localBrushExtent[1]) >= 0 &&
    xScale(localBrushExtent[1]) <= innerWidth;

  return useMemo(
    () => (
      <>
        <defs>
          <linearGradient
            id={`${id}-gradient-selection`}
            x1="0%"
            x2="100%"
            y1="100%"
            y2="100%"
          >
            <stop stopColor="transparent" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>

          {/* clips at exactly the svg area */}
          <clipPath id={`${id}-brush-clip`}>
            <rect height={innerHeight} width={innerWidth} x="0" y="0" />
          </clipPath>
        </defs>

        {/* will host the d3 brush */}
        {setBrushExtent ? (
          <g
            clipPath={`url(#${id}-brush-clip)`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            ref={brushRef}
          />
        ) : null}

        {/* custom brush handles */}
        {localBrushExtent ? (
          <>
            {westHandleInView ? (
              <g
                transform={`translate(${Math.max(
                  0,
                  xScale(localBrushExtent[0])
                )}, 0), scale(${flipWestHandle ? "-1" : "1"}, 1)`}
              >
                <g>
                  <path
                    d={brushHandlePath(innerHeight)}
                    fill="transparent"
                    pointerEvents="none"
                    stroke="#31cb9e"
                    strokeWidth={2}
                  />
                </g>

                <g
                  className="transition-opacity duration-300"
                  opacity={alwaysShowLabel || showLabels || hovering ? 1 : 0}
                  transform={`translate(50,0), scale(${
                    flipWestHandle ? "1" : "-1"
                  }, 1)`}
                >
                  <rect
                    fill="transparent"
                    height="30"
                    rx="8"
                    width="60"
                    x="-30"
                    y="0"
                  />

                  <text
                    dominantBaseline="middle"
                    fill="#979797"
                    fontSize="13px"
                    textAnchor="middle"
                    transform="scale(-1, 1)"
                    y="15"
                  >
                    {brushLabelValue("w", localBrushExtent[0])}
                  </text>
                </g>
              </g>
            ) : null}

            {eastHandleInView ? (
              <g
                transform={`translate(${xScale(
                  localBrushExtent[1]
                )}, 0), scale(${flipEastHandle ? "-1" : "1"}, 1)`}
              >
                <g>
                  <path
                    d={brushHandlePath(innerHeight)}
                    fill="transparent"
                    pointerEvents="none"
                    stroke="#7289DA"
                    strokeWidth={2}
                  />
                </g>

                <g
                  className="transition-opacity duration-300"
                  opacity={alwaysShowLabel || showLabels || hovering ? 1 : 0}
                  transform={`translate(50,0), scale(${
                    flipEastHandle ? "-1" : "1"
                  }, 1)`}
                >
                  <rect
                    fill="transparent"
                    height="30"
                    rx="8"
                    width="60"
                    x="-30"
                    y="0"
                  />

                  <text
                    dominantBaseline="middle"
                    fill="#979797"
                    fontSize="13px"
                    textAnchor="middle"
                    y="15"
                  >
                    {brushLabelValue("e", localBrushExtent[1])}
                  </text>
                </g>
              </g>
            ) : null}

            {showWestArrow ? <OffScreenHandle color="#31cb9e" /> : null}

            {showEastArrow ? (
              <g transform={`translate(${innerWidth}, 0) scale(-1, 1)`}>
                <OffScreenHandle color="#7289DA" />
              </g>
            ) : null}
          </>
        ) : null}
      </>
    ),
    [
      id,
      innerWidth,
      innerHeight,
      setBrushExtent,
      localBrushExtent,
      westHandleInView,
      xScale,
      flipWestHandle,
      showLabels,
      hovering,
      brushLabelValue,
      eastHandleInView,
      flipEastHandle,
      showWestArrow,
      showEastArrow,
    ]
  );
}
