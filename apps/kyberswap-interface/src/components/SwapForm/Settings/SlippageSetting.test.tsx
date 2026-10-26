// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'

import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'

vi.mock('components/InfoHelper', () => ({ default: () => null }))
vi.mock('components/SlippageWarningNote', () => ({ default: () => null }))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: () => null }))
vi.mock('components/SlippageControl', () => ({
  default: ({ isHighlight }: { isHighlight: boolean }) => <input aria-label="Slippage" data-highlight={isHighlight} />,
}))
vi.mock('state/swap/hooks', () => ({
  useDefaultSlippageByPair: () => 50,
  usePairCategory: () => 'stablePair',
}))
vi.mock('state/user/hooks', () => ({
  useDegenModeManager: () => [false],
  useSlippageSettingByPage: () => ({ rawSlippage: 50, setRawSlippage: vi.fn(), isSlippageControlPinned: true }),
}))
vi.mock('theme', () => ({ ExternalLink: () => null }))

const Harness = () => {
  const navigate = useNavigate()
  const { search } = useLocation()
  return (
    <>
      <button onClick={() => navigate('?pair=retained&action=open-slippage-panel')}>Retry</button>
      <output>{search}</output>
      <SlippageSetting />
    </>
  )
}

i18n.loadAndActivate({ locale: 'en', messages: {} })
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  container?.remove()
  vi.useRealTimers()
})

it('consumes the URL action, restarts its four-second highlight on retry, and cancels it on unmount', async () => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root?.render(
      <I18nProvider i18n={i18n}>
        <MemoryRouter initialEntries={['?pair=retained&action=open-slippage-panel']}>
          <Harness />
        </MemoryRouter>
      </I18nProvider>,
    ),
  )
  const input = container.querySelector<HTMLInputElement>('input')
  const retry = () => act(async () => container.querySelector('button')?.click())
  const advance = (duration: number) => act(async () => vi.advanceTimersByTime(duration))

  expect(container.querySelector('output')?.textContent).toBe('?pair=retained')
  expect(input?.dataset.highlight).toBe('true')
  await advance(3000)
  await retry()
  await advance(1000)
  expect(input?.dataset.highlight).toBe('true')
  await advance(3000)
  expect(input?.dataset.highlight).toBe('false')

  await retry()
  expect(input?.dataset.highlight).toBe('true')
  expect(vi.getTimerCount()).toBe(1)
  await act(async () => root?.unmount())
  root = undefined
  expect(vi.getTimerCount()).toBe(0)
})
