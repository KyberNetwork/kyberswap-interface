// @vitest-environment happy-dom
import { ComponentProps, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { Collapse } from 'components/Collapse'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement

const render = async (props: Omit<ComponentProps<typeof Collapse>, 'children'> = {}) => {
  if (!root) {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  }
  await act(async () => {
    root?.render(
      <Collapse trigger={({ buttonProps }) => <button {...buttonProps}>Details</button>} {...props}>
        <input defaultValue="initial" />
      </Collapse>,
    )
  })
}
const required = <T,>(value: T | null): T => {
  if (value === null) throw new Error('Expected disclosure element is missing')
  return value
}
const button = () => required(container.querySelector('button'))
const panel = () => required(document.getElementById(required(button().getAttribute('aria-controls'))))
const toggle = async () => act(async () => button().click())

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  container?.remove()
  vi.useRealTimers()
})

it('owns uncontrolled state, keeps input drafts and applies defaultOpen only on mount', async () => {
  const onOpenChange = vi.fn()
  await render({ defaultOpen: true, onOpenChange, contentGap: 2 })
  const input = required(container.querySelector('input'))
  input.value = 'draft'
  await toggle()
  expect(button().getAttribute('aria-expanded')).toBe('false')
  expect(panel().getAttribute('aria-hidden')).toBe('true')
  expect(panel().hasAttribute('inert')).toBe(true)
  expect(onOpenChange.mock.calls).toEqual([[false]])

  await render({ defaultOpen: true, onOpenChange, contentGap: 4 })
  expect(button().getAttribute('aria-expanded')).toBe('false')
  await toggle()
  expect(container.querySelector('input')).toBe(input)
  expect(input.value).toBe('draft')
  expect(panel().hasAttribute('inert')).toBe(false)
  expect(onOpenChange.mock.calls).toEqual([[false], [true]])
})

it('requests controlled changes without overriding the parent or notifying on prop updates', async () => {
  const onOpenChange = vi.fn()
  await render({ open: false, defaultOpen: true, onOpenChange, id: 'controlled-details' })
  await toggle()
  expect(onOpenChange.mock.calls).toEqual([[true]])
  expect(button().getAttribute('aria-expanded')).toBe('false')
  expect(panel().id).toBe('controlled-details')
  await render({ open: true, onOpenChange, id: 'controlled-details' })
  expect(button().getAttribute('aria-expanded')).toBe('true')
  expect(onOpenChange).toHaveBeenCalledTimes(1)
})

it('defers unmount until exit completes and cancels stale cleanup on a quick reopen', async () => {
  vi.useFakeTimers()
  await render({ open: true, unmountOnExit: true })
  panel().style.transitionDuration = '200ms'
  panel().style.transitionDelay = '0ms'
  const input = required(container.querySelector('input'))
  await render({ open: false, unmountOnExit: true })
  expect(container.querySelector('input')).toBe(input)
  await act(async () => vi.advanceTimersByTime(100))
  await render({ open: true, unmountOnExit: true })
  await act(async () => vi.advanceTimersByTime(300))
  expect(container.querySelector('input')).toBe(input)
  await render({ open: false, unmountOnExit: true })
  await act(async () => vi.advanceTimersByTime(250))
  expect(container.querySelector('input')).toBeNull()
})

it('does not mount initially closed lazy content and cleans up without waiting when transitions are disabled', async () => {
  await render({ open: false, unmountOnExit: true })
  expect(container.querySelector('input')).toBeNull()
  await render({ open: true, unmountOnExit: true })
  expect(container.querySelector('input')).not.toBeNull()
  panel().style.transitionDuration = '0s'
  await render({ open: false, unmountOnExit: true })
  expect(container.querySelector('input')).toBeNull()
})
