// @vitest-environment happy-dom
import { type ReactNode, act } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import Skeleton from 'components/Skeleton'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import TextSkeleton from 'components/Skeleton/TextSkeleton'

vi.mock('hooks/useTheme', () => ({ default: () => ({ background: '#1C1C1C', buttonGray: '#292929' }) }))

let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  container.remove()
  vi.unstubAllGlobals()
})

const render = async (children: ReactNode) => {
  root ??= createRoot(container)
  await act(async () => root?.render(children))
}
const widths = () => Array.from(container.querySelectorAll<HTMLElement>('.sample'), element => element.style.width)

it.each([
  ['shimmer', Skeleton],
  ['cell', TableCellSkeleton],
  ['text', TextSkeleton],
] as const)('%s keeps random width bounded and stable during rerenders', async (_, Component) => {
  await render(<Component className="sample" width={80} height={14} randomWidth />)
  const [width] = widths()
  expect(parseFloat(width)).toBeGreaterThanOrEqual(50)
  expect(parseFloat(width)).toBeLessThanOrEqual(80)

  await render(<Component className="sample" width={80} height={20} randomWidth />)
  expect(widths()).toEqual([width])
  expect(container.querySelector('.sample')?.getAttribute('randomwidth')).toBeNull()

  await render(<Component className="sample" width={80} height={14} />)
  expect(widths()).toEqual(['80px'])
})

const SeededList = ({ items }: { items: string[] }) => (
  <>
    {items.map(key => (
      <div key={key} data-item={key}>
        <TableCellSkeleton className="sample" width={64} height={14} randomWidth widthSeed={key} />
      </div>
    ))}
  </>
)

it('keeps item widths through reordering and remounts, preserving the balance width pattern', async () => {
  const items = ['token-a', 'token-b', 'token-c', 'token-d']
  const byItem = () =>
    Object.fromEntries(
      Array.from(container.querySelectorAll<HTMLElement>('[data-item]'), element => [
        element.dataset.item,
        element.querySelector<HTMLElement>('.sample')?.style.width,
      ]),
    )

  await render(<SeededList items={items} />)
  const initial = byItem()
  expect(new Set(Object.values(initial))).toEqual(new Set(['40px', '48px', '56px', '64px']))
  await render(<SeededList items={items.slice().reverse()} />)
  expect(byItem()).toEqual(initial)

  await act(async () => root?.unmount())
  root = undefined
  await render(<SeededList items={items} />)
  expect(byItem()).toEqual(initial)
  expect(container.querySelector('[widthseed]')).toBeNull()
})

const ServerScene = () => (
  <>
    <Skeleton className="sample" height={14} randomWidth />
    <TableCellSkeleton className="sample" width="80%" height={14} randomWidth />
    <TextSkeleton className="sample" width="60%" randomWidth />
  </>
)

it('hydrates automatic percentage widths without changing the server layout', async () => {
  container.innerHTML = renderToString(<ServerScene />)
  const serverWidths = widths()
  const onRecoverableError = vi.fn()
  expect(serverWidths).toHaveLength(3)
  expect(serverWidths.every(width => width.startsWith('calc('))).toBe(true)

  await act(async () => {
    root = hydrateRoot(container, <ServerScene />, { onRecoverableError })
  })
  expect(widths()).toEqual(serverWidths)
  expect(onRecoverableError).not.toHaveBeenCalled()
})
