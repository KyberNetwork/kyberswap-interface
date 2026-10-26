// @vitest-environment happy-dom
import { type MouseEventParams } from 'lightweight-charts'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import TokenPriceChartCanvas from 'components/TokenPriceChart/TokenPriceChartCanvas'
import { type DisplayCandle } from 'components/TokenPriceChart/chartOptions'

const mocks = vi.hoisted(() => {
  const series = { applyOptions: vi.fn(), setData: vi.fn(), barsInLogicalRange: vi.fn() }
  const timeScale = {
    getVisibleLogicalRange: vi.fn(),
    setVisibleLogicalRange: vi.fn(),
    subscribeVisibleLogicalRangeChange: vi.fn((_callback: (range: { from: number; to: number }) => void) => undefined),
    unsubscribeVisibleLogicalRangeChange: vi.fn(
      (_callback: (range: { from: number; to: number }) => void) => undefined,
    ),
  }
  const chart = {
    addCandlestickSeries: vi.fn(() => series),
    addHistogramSeries: vi.fn(() => series),
    priceScale: () => ({ applyOptions: vi.fn() }),
    timeScale: () => timeScale,
    applyOptions: vi.fn(),
    resize: vi.fn(),
    remove: vi.fn(),
    subscribeCrosshairMove: vi.fn((_callback: (event: Partial<MouseEventParams>) => void) => undefined),
    unsubscribeCrosshairMove: vi.fn((_callback: (event: Partial<MouseEventParams>) => void) => undefined),
  }
  return { chart, series, timeScale, createChart: vi.fn(() => chart), disconnect: vi.fn() }
})
vi.mock('lightweight-charts', () => ({
  createChart: mocks.createChart,
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2 },
}))
vi.mock('react-use', () => ({ useMedia: () => false }))
vi.mock('hooks/useTheme', () => ({
  default: () => ({ text: '#ffffff', primary: '#00ff00', red: '#ff0000', darkGreen: '#00ff00', subText: '#cccccc' }),
}))
vi.mock('pages/Earns/PoolDetail/components/PoolChartState', () => ({
  PoolChartWrapper: ({ height, ...props }: React.ComponentPropsWithRef<'div'> & { height: number }) => (
    <div {...props} />
  ),
}))
vi.mock('components/TokenPriceChart/PriceChartTooltip', () => ({ default: () => <span data-tooltip /> }))

const candles: DisplayCandle[] = [{ bucket: '1', time: 1, open: 1, close: 2, high: 3, low: 1, volume: 10 }]
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  container?.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

it('preserves viewport on updates and releases resize, crosshair and pagination subscriptions on identity change', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 0))
  vi.stubGlobal('cancelAnimationFrame', clearTimeout)
  let resize!: (entries: { contentRect: { width: number } }[]) => void
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: typeof resize) {
        resize = callback
      }
      observe() {}
      disconnect = mocks.disconnect
    },
  )
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: () => Promise.resolve([]) } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  const loadMore = vi.fn()
  const render = async (key: string, chartData = candles) => {
    await act(async () =>
      root?.render(
        <TokenPriceChartCanvas key={key} chartData={chartData} timeFrame="1d" canLoadMore onLoadMore={loadMore} />,
      ),
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
  }
  await render('token:1d')
  expect(mocks.createChart).toHaveBeenCalledOnce()
  expect(mocks.timeScale.setVisibleLogicalRange).toHaveBeenCalledOnce()
  resize([{ contentRect: { width: 500 } }])
  expect(mocks.chart.resize).toHaveBeenCalledWith(500, 360)

  const rangeHandler = mocks.timeScale.subscribeVisibleLogicalRangeChange.mock.calls[0][0]
  mocks.series.barsInLogicalRange.mockReturnValue({ barsBefore: 20 })
  rangeHandler({ from: 0, to: 1 })
  expect(loadMore).toHaveBeenCalledOnce()
  mocks.series.barsInLogicalRange.mockReturnValue({ barsBefore: 21 })
  rangeHandler({ from: 0, to: 1 })
  expect(loadMore).toHaveBeenCalledOnce()

  const crosshair = mocks.chart.subscribeCrosshairMove.mock.calls[0][0] as (event: Partial<MouseEventParams>) => void
  await act(async () =>
    crosshair({ time: 1 as MouseEventParams['time'], point: { x: 10, y: 10 } as MouseEventParams['point'] }),
  )
  expect(container.querySelector('[data-tooltip]')).not.toBeNull()
  await render('token:1d', [{ ...candles[0], time: 0 }, ...candles])
  expect(mocks.createChart).toHaveBeenCalledOnce()
  expect(mocks.timeScale.setVisibleLogicalRange).toHaveBeenCalledOnce()

  await render('token:1h')
  expect(mocks.chart.remove).toHaveBeenCalledOnce()
  expect(mocks.disconnect).toHaveBeenCalledOnce()
  expect(mocks.chart.unsubscribeCrosshairMove).toHaveBeenCalledWith(crosshair)
  expect(mocks.timeScale.unsubscribeVisibleLogicalRangeChange).toHaveBeenCalledWith(rangeHandler)
  expect(mocks.createChart).toHaveBeenCalledTimes(2)
  expect(mocks.timeScale.setVisibleLogicalRange).toHaveBeenCalledTimes(2)
})
