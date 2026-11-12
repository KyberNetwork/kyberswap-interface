// @vitest-environment happy-dom
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { UnifiedSwapForm } from './UnifiedSwapForm'

vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1 }) }))
vi.mock('hooks/useWrapCallback', () => ({ WrapType: { NOT_APPLICABLE: 0 } }))
vi.mock('hooks/useContract', () => ({ useReadingContract: vi.fn() }))
vi.mock('wagmi', () => ({ useReadContract: vi.fn() }))
vi.mock('hooks/useTracking', () => ({ default: () => ({ trackingHandler: vi.fn() }), TRACKING_EVENT_TYPE: {} }))
vi.mock('state/wallet/hooks', () => ({ useCurrencyBalance: vi.fn() }))
vi.mock('state/wallet/WalletBalanceContext', async () => ({
  WalletBalanceContext: (await import('react')).createContext(undefined),
}))
vi.mock('components/SwapWallets/SwapWalletContext', () => ({ useSwapWallets: () => undefined }))
vi.mock('components/SwapWallets/CrossChainEvmSenderWalletSelector', () => ({
  CrossChainEvmSenderWalletSelector: () => null,
}))
vi.mock('./CrossChain/hooks/useCrossChainBalance', () => ({ useCrossChainBalance: vi.fn() }))
vi.mock('./CrossChain/CrossChainCurrencyPanel', () => ({ CrossChainCurrencyPanel: () => null }))
vi.mock('./CurrencyInput/ERC8056Info', () => ({
  default: () => null,
  useERC8056SwapInfo: ({ currencyIn }: any) => ({
    inputInfo: { multiplier: currencyIn.multiplier },
    outputInfo: {},
    input: {},
    output: {},
    tokens: [],
  }),
}))
vi.mock('./CurrencyInput/InputCurrencyPanel', () => ({
  default: ({ typedValue, onUserInput }: any) => (
    <button data-input onClick={() => onUserInput('2')}>
      {typedValue}
    </button>
  ),
}))
vi.mock('./CurrencyInput/OutputCurrencyPanel', () => ({ default: () => null }))
vi.mock('./SwapFormLayout', () => ({
  SwapFormLayout: ({ inputPanel, onReverse }: any) => (
    <>
      {inputPanel}
      <button data-reverse onClick={onReverse}>
        Reverse
      </button>
    </>
  ),
}))
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  root = createRoot(container)
})
const writes = vi.fn()
const Harness = ({ outputAmount }: { outputAmount?: string }) => {
  const [raw, setRaw] = useState('1')
  const [reversed, setReversed] = useState(false)
  const token = { isNative: false, chainId: 1, multiplier: (reversed ? 3n : 2n) * 10n ** 18n } as any
  return (
    <>
      <span data-raw>{raw}</span>
      <UnifiedSwapForm
        hidden={false}
        amount={raw}
        onAmountChange={value => {
          writes(value)
          setRaw(value)
        }}
        currencyIn={token}
        currencyOut={token}
        fromChainId={1}
        toChainId={1}
        outputAmount={outputAmount}
        loading={false}
        onChangeCurrencyIn={vi.fn()}
        onChangeCurrencyOut={vi.fn()}
        onSelectNonEvmCurrencyIn={vi.fn()}
        onSelectNonEvmCurrencyOut={vi.fn()}
        onReverse={() => setReversed(true)}
        details={null}
        action={null}
      />
    </>
  )
}
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})
it.each([
  { outputAmount: '1', raw: '1', display: '3' },
  { outputAmount: '4', raw: '4', display: '12' },
  { outputAmount: undefined, raw: '1', display: '3' },
])(
  'reverses with raw output $outputAmount without retaining the previous display draft',
  async ({ outputAmount, raw, display }) => {
    await act(async () => root.render(<Harness outputAmount={outputAmount} />))
    await act(async () => container.querySelector<HTMLButtonElement>('[data-input]')?.click())
    writes.mockClear()
    await act(async () => container.querySelector<HTMLButtonElement>('[data-reverse]')?.click())
    expect(container.querySelector('[data-raw]')?.textContent).toBe(raw)
    expect(container.querySelector('[data-input]')?.textContent).toBe(display)
    expect(writes.mock.calls).toEqual([[raw]])
  },
)
