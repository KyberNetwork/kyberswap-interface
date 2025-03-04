import type { ZoomTransform } from "d3";
import { max, scaleLinear } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import partition from "lodash.partition";
import type { ChartEntry, ChartProps } from "@/types";
import { Bound } from "@/types";
import Area from "@/components/Area";
import AxisBottom from "@/components/AxisBottom";
import Brush from "@/components/Brush";
import Line from "@/components/Line";
import Zoom from "@/components/Zoom";

const xAccessor = (d: ChartEntry) => d.price;
const yAccessor = (d: ChartEntry) => d.activeLiquidity;

let zoomTimeout: ReturnType<typeof setTimeout> | undefined;

export default function Chart({
  id = "liquidityChart",
  data: { series, current },
  dimensions: { width, height },
  margins,
  brushDomain,
  zoomLevels,
  zoomPosition,
  zoomInIcon,
  zoomOutIcon,
  brushLabels,
  onBrushDomainChange,
}: ChartProps) {
  const zoomRef = useRef<SVGRectElement | null>(null);

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
    const isHighToLow = series[0]?.price > series[series.length - 1]?.price;
    let [left, right] = partition(series, (d: ChartEntry) =>
      isHighToLow
        ? Number(xAccessor(d)) < current
        : Number(xAccessor(d)) > current
    );

    if (right.length && right[right.length - 1]) {
      if (right[right.length - 1].price !== current) {
        right = [
          ...right,
          {
            activeLiquidity: right[right.length - 1].activeLiquidity,
            price: current,
          },
        ];
      }
      left = [
        {
          activeLiquidity: right[right.length - 1].activeLiquidity,
          price: current,
        },
        ...left,
      ];
    }

    return [left, right];
  }, [current, series]);

  const westHandleInView =
    brushDomain &&
    xScale(brushDomain[0]) >= 0 &&
    xScale(brushDomain[0]) <= innerWidth;
  const eastHandleInView =
    brushDomain &&
    xScale(brushDomain[1]) >= 0 &&
    xScale(brushDomain[1]) <= innerWidth;

  return (
    <>
      <Zoom
        height={height} // allow zooming inside the x-axis
        setZoom={setZoom}
        showResetButton={Boolean(
          (!westHandleInView && !eastHandleInView) ||
            (zoom && zoom.k >= 0.5 * 2 ** 4) ||
            (zoom && zoom.k <= 0.5 * 2 ** -3)
        )}
        svg={zoomRef.current}
        width={innerWidth}
        xScale={xScale}
        zoomInIcon={zoomInIcon}
        zoomLevels={zoomLevels}
        zoomOutIcon={zoomOutIcon}
        zoomPosition={zoomPosition}
      />
      <svg
        className="overflow-visible"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect height={height} width={innerWidth} x="0" y="0" />
          </clipPath>

          {brushDomain ? (
            <mask id={`${id}-area-mask`}>
              <rect
                fill="white"
                height={innerHeight}
                width={xScale(brushDomain[1]) - xScale(brushDomain[0])}
                x={xScale(brushDomain[0])}
                y="0"
              />
            </mask>
          ) : null}
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-clip)`}>
            <Area
              fill="#065F44"
              opacity={1}
              series={leftSeries}
              xScale={xScale}
              xValue={xAccessor}
              yScale={yScale}
              yValue={yAccessor}
            />
            <Area
              fill="#065F44"
              opacity={1}
              series={rightSeries}
              xScale={xScale}
              xValue={xAccessor}
              yScale={yScale}
              yValue={yAccessor}
            />

            {brushDomain ? (
              <g mask={`url(#${id}-area-mask)`}>
                <Area
                  fill="#31cb9e"
                  opacity={1}
                  series={series}
                  xScale={xScale}
                  xValue={xAccessor}
                  yScale={yScale}
                  yValue={yAccessor}
                />
              </g>
            ) : null}
            <Line innerHeight={innerHeight} value={current} xScale={xScale} />
            <AxisBottom innerHeight={innerHeight} xScale={xScale} />
          </g>

          <rect
            cursor="grab"
            fill="transparent"
            height={height}
            ref={zoomRef}
            width={innerWidth}
          />

          <Brush
            brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
            brushLabelValue={brushLabels}
            id={id}
            innerHeight={innerHeight}
            innerWidth={innerWidth}
            setBrushExtent={onBrushDomainChange}
            xScale={xScale}
            zoomInited={zoomInited}
          />
        </g>
      </svg>
    </>
  );
}
