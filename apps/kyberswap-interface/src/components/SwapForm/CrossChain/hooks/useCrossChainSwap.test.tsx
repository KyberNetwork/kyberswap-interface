// @vitest-environment happy-dom
import { act, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import CrossChainSwapProvider, { useOptionalCrossChainSwap } from './useCrossChainSwap'

const engine = vi.hoisted(() => ({ loaded: vi.fn(), mount: vi.fn(), stop: vi.fn(), enabled: vi.fn() }))
vi.mock('./CrossChainSwapEngine', async () => {
  engine.loaded()
  const { memo, useLayoutEffect } = await import('react')
  return {
    default: memo(({ onChange, enabled }: any) => {
      useLayoutEffect(() => {
        engine.mount()
        return engine.stop
      }, [])
      useLayoutEffect(() => {
        engine.enabled(enabled)
        onChange({ amount: '1' })
      }, [onChange, enabled])
      return null
    }),
  }
})
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const container = document.createElement('div')
const root = createRoot(container)
const mounts = vi.fn()
const setAmount = vi.fn()
const Form = () => {
  const quote = useOptionalCrossChainSwap()
  const [draft, setDraft] = useState('')
  useEffect(() => {
    mounts()
  }, [])
  return (
    <button onClick={() => setDraft('retained')}>
      {draft}:{quote ? 'ready' : 'empty'}
    </button>
  )
}
const render = (enabled: boolean) =>
  act(async () =>
    root.render(
      <CrossChainSwapProvider
        enabled={enabled}
        fromChain={1}
        toChain={8453}
        tokenIn="ETH"
        tokenOut="ETH"
        amount="1"
        setAmount={setAmount}
      >
        <Form />
      </CrossChainSwapProvider>,
    ),
  )
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('loads on first activation and retains the engine and form while disabled', async () => {
  await render(false)
  expect(engine.loaded).not.toHaveBeenCalled()
  expect(engine.mount).not.toHaveBeenCalled()
  await act(async () => container.querySelector('button')?.click())
  await render(true)
  expect(engine.mount).toHaveBeenCalledTimes(1)
  expect(container.textContent).toBe('retained:ready')
  await render(false)
  expect(engine.stop).not.toHaveBeenCalled()
  expect(engine.enabled).toHaveBeenLastCalledWith(false)
  expect(container.textContent).toBe('retained:empty')
  await render(true)
  expect(engine.mount).toHaveBeenCalledTimes(1)
  expect(engine.enabled).toHaveBeenLastCalledWith(true)
  expect(container.textContent).toBe('retained:ready')
  expect(mounts).toHaveBeenCalledTimes(1)
})
