import { max, scaleLinear, ZoomTransform } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import partition from "lodash.partition";

import { Area } from "./Area";
import { AxisBottom } from "./AxisBottom";
import { Brush } from "./Brush";
import { Line } from "./Line";
import { Bound, ChartEntry, LiquidityChartRangeInputProps } from "../types";
import Zoom from "./Zoom";
import { useWidgetContext } from "@/stores/widget";

const xAccessor = (d: ChartEntry) => d.price0;
const yAccessor = (d: ChartEntry) => d.activeLiquidity;

let zoomTimeout: ReturnType<typeof setTimeout> | undefined;

export function Chart({
  id = "liquidityChartRangeInput",
  data: { series, current },
  ticksAtLimit,
  styles,
  dimensions: { width, height },
  margins,
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  zoomLevels,
  showZoomButtons = true,
}: LiquidityChartRangeInputProps) {
  const zoomRef = useRef<SVGRectElement | null>(null);
  const theme = useWidgetContext((s) => s.theme);

  const [zoom, setZoom] = useState<ZoomTransform | null>(null);
  const [zoomInited, setZoomInited] = useState(false);

  const [innerHeight, innerWidth] = useMemo(
    () => [
      height - margins.top - margins.bottom,
      width - margins.left - margins.right,
    ],
    [width, height, margins]
  );

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear()
        .domain([
          current * zoomLevels.initialMin,
          current * zoomLevels.initialMax,
        ] as number[])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)] as number[])
        .range([innerHeight, 0]),
    };

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale);
      scales.xScale.domain(newXscale.domain());
    }

    return scales;
  }, [
    current,
    zoomLevels.initialMin,
    zoomLevels.initialMax,
    innerWidth,
    series,
    innerHeight,
    zoom,
  ]);

  useEffect(() => {
    // reset zoom as necessary
    setZoom(null);
  }, [zoomLevels]);

  useEffect(() => {
    if (zoomInited) return;
    if (zoom && zoomTimeout) {
      clearTimeout(zoomTimeout);
    }

    zoomTimeout = setTimeout(() => {
      setZoomInited(true);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const [leftSeries, rightSeries] = useMemo(() => {
    const isHighToLow = series[0]?.price0 > series[series.length - 1]?.price0;
    let [left, right] = partition(series, (d) =>
      isHighToLow ? +xAccessor(d) < current : +xAccessor(d) > current
    );

    if (right.length && right[right.length - 1]) {
      if (right[right.length - 1].price0 !== current) {
        right = [
          ...right,
          {
            activeLiquidity: right[right.length - 1].activeLiquidity,
            price0: current,
          },
        ];
      }
      left = [
        {
          activeLiquidity: right[right.length - 1].activeLiquidity,
          price0: current,
        },
        ...left,
      ];
    }

    return [left, right];
  }, [current, series]);

  return (
    <>
      {showZoomButtons && (
        <Zoom
          svg={zoomRef.current}
          xScale={xScale}
          setZoom={setZoom}
          width={innerWidth}
          height={
            // allow zooming inside the x-axis
            height
          }
          resetBrush={() => {
            onBrushDomainChange(
              [
                current * zoomLevels.initialMin,
                current * zoomLevels.initialMax,
              ] as [number, number],
              "reset"
            );
          }}
          showResetButton={Boolean(
            ticksAtLimit[Bound.LOWER] || ticksAtLimit[Bound.UPPER]
          )}
          zoomLevels={zoomLevels}
        />
      )}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={innerWidth} height={height} />
          </clipPath>

          {brushDomain && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill="white"
                x={xScale(brushDomain[0])}
                y="0"
                width={xScale(brushDomain[1]) - xScale(brushDomain[0])}
                height={innerHeight}
              />
            </mask>
          )}
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-chart-clip)`}>
            <Area
              series={leftSeries}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              opacity={1}
              fill={"#065F44"}
            />
            <Area
              series={rightSeries}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              opacity={1}
              fill={"#065F44"}
            />

            {brushDomain && (
              // duplicate area chart with mask for selected area
              <g mask={`url(#${id}-chart-area-mask)`}>
                <Area
                  opacity={1}
                  series={series}
                  xScale={xScale}
                  yScale={yScale}
                  xValue={xAccessor}
                  yValue={yAccessor}
                  fill={theme.accent}
                />
              </g>
            )}

            <Line value={current} xScale={xScale} innerHeight={innerHeight} />

            <AxisBottom xScale={xScale} innerHeight={innerHeight} />
          </g>

          <rect
            fill="transparent"
            cursor="grab"
            width={innerWidth}
            height={height}
            ref={zoomRef}
          />

          <Brush
            id={id}
            xScale={xScale}
            interactive={interactive}
            brushLabelValue={brushLabels}
            brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            setBrushExtent={onBrushDomainChange}
            westHandleColor={styles.brush.handle.west}
            eastHandleColor={styles.brush.handle.east}
            zoomInited={zoomInited}
          />
        </g>
      </svg>
    </>
  );
}
