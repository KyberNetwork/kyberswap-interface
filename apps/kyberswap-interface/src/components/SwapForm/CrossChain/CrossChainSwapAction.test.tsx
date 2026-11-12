// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { NonEvmChain } from 'types/crossChain'

import { CrossChainSwapAction } from './CrossChainSwapAction'
import CrossChainSwapProvider, { useOptionalCrossChainSwap } from './hooks/useCrossChainSwap'

const mocks = vi.hoisted(() => ({
  degen: false,
  setParams: vi.fn(),
  openReview: vi.fn(),
  closeReview: vi.fn(),
  confirmSwap: vi.fn(),
  allowance: vi.fn(async () => true),
  selectedQuote: { quote: { priceImpact: 11 as number | null } },
  reviewQuote: null as unknown,
}))
vi.mock('state/user/hooks', () => ({ useDegenModeManager: () => [mocks.degen] }))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams(), mocks.setParams] }))
vi.mock('components/Button', () => ({ ButtonPrimary: (props: any) => <button {...props} /> }))
vi.mock('components/Dots', () => ({ default: ({ children }: any) => <span>{children}</span> }))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: ({ children }: any) => <span>{children}</span> }))
vi.mock('./CrossChainSwapConfirmation', () => ({
  CrossChainSwapConfirmation: ({ isOpen, onConfirm }: any) =>
    isOpen ? (
      <button data-confirm onClick={onConfirm}>
        Confirm
      </button>
    ) : null,
}))
vi.mock('./hooks/useCrossChainPair', () => ({
  useCrossChainPair: () => ({
    fromChainId: 'bitcoin',
    toChainId: 1,
    currencyIn: { symbol: 'BTC' },
    currencyOut: { symbol: 'ETH' },
  }),
}))
vi.mock('./hooks/useCrossChainRecipient', () => ({
  useCrossChainRecipient: () => ({ sender: 'sender', receiver: 'receiver' }),
}))
vi.mock('./hooks/useCrossChainQuote', () => ({
  useCrossChainQuote: () => ({
    amountInWei: '1',
    selectedQuote: mocks.selectedQuote,
    reviewQuote: mocks.reviewQuote,
    showPreview: !!mocks.reviewQuote,
    openReview: mocks.openReview,
    closeReview: mocks.closeReview,
  }),
}))
vi.mock('./hooks/useCrossChainExecution', () => ({
  useCrossChainExecution: () => ({
    submitSwap: mocks.confirmSwap,
    resetSubmission: vi.fn(),
  }),
}))
vi.mock('./hooks/useCrossChainApproval', () => ({
  useCrossChainApproval: () => ({ approvalState: 3, revalidateAllowance: mocks.allowance }),
}))
vi.mock('./hooks/useCrossChainBalance', () => ({ useCrossChainBalance: () => '100' }))
vi.mock('components/SwapWallets/SwapWalletContext', () => ({ useSwapWallets: () => ({ inputAddress: 'sender' }) }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1 }) }))
vi.mock('hooks/useApproveCallback', () => ({ ApprovalState: { NOT_APPROVED: 1 } }))
vi.mock('hooks/useRestrictedTokens', () => ({
  useIsTokenAddressRestricted: () => () => false,
  restrictedTokenMessage: vi.fn(),
}))
vi.mock('hooks/web3/useChangeNetwork', () => ({ useChangeNetwork: () => ({ changeNetwork: vi.fn() }) }))
vi.mock('state/wallet/hooks', () => ({ useCurrencyBalance: vi.fn() }))
vi.mock('services/crossChain/quote/utils', () => ({ isEvmCurrency: () => false }))
vi.mock('services/crossChain/utils', () => ({ isQuoteExecutable: () => true }))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const ReadyAction = () => (useOptionalCrossChainSwap() ? <CrossChainSwapAction /> : null)
const render = async () => {
  await act(async () => {
    await import('./hooks/CrossChainSwapEngine')
    root.render(
      <I18nProvider i18n={i18n}>
        <CrossChainSwapProvider
          fromChain={NonEvmChain.Bitcoin}
          toChain={1}
          tokenIn="BTC"
          tokenOut="ETH"
          amount="1"
          setAmount={vi.fn()}
        >
          <ReadyAction />
        </CrossChainSwapProvider>
      </I18nProvider>,
    )
  })
  await vi.waitFor(async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })
    expect(container.querySelector('button')).not.toBeNull()
  })
}
const click = (selector = 'button') =>
  act(async () => {
    const button = container.querySelector<HTMLButtonElement>(selector)
    if (!button) throw new Error('Missing action button')
    button.click()
  })
beforeEach(() => {
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  vi.clearAllMocks()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.degen = false
  mocks.selectedQuote = { quote: { priceImpact: 11 } }
  mocks.allowance.mockResolvedValue(true)
  mocks.reviewQuote = null
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})
it.each([11, NaN])('gates PI %s before review, then reviews after enabling Degen Mode', async priceImpact => {
  mocks.selectedQuote.quote.priceImpact = priceImpact
  await render()
  await click()
  expect(mocks.setParams.mock.calls[0][0](new URLSearchParams()).get('enableDegenMode')).toBe('true')
  expect(mocks.openReview).not.toHaveBeenCalled()
  expect(mocks.allowance).not.toHaveBeenCalled()
  mocks.degen = true
  await render()
  await click()
  expect(mocks.allowance).toHaveBeenCalledOnce()
  expect(mocks.openReview).toHaveBeenCalledOnce()
})
it('allows PI exactly 10 without Degen Mode', async () => {
  mocks.selectedQuote.quote.priceImpact = 10
  await render()
  await click()
  expect(mocks.setParams).not.toHaveBeenCalled()
  expect(mocks.openReview).toHaveBeenCalledOnce()
})
it('closes review before requesting Settings if Degen Mode is disabled at confirmation', async () => {
  mocks.reviewQuote = { quote: { priceImpact: 11 } }
  await render()
  await click('[data-confirm]')
  expect(mocks.confirmSwap).not.toHaveBeenCalled()
  expect(mocks.closeReview).toHaveBeenCalledOnce()
  expect(mocks.setParams).toHaveBeenCalledOnce()
  expect(mocks.closeReview.mock.invocationCallOrder[0]).toBeLessThan(mocks.setParams.mock.invocationCallOrder[0])
})

it('confirms the reviewed quote once when Degen Mode remains enabled', async () => {
  mocks.degen = true
  mocks.reviewQuote = { quote: { priceImpact: 11 } }
  await render()
  await click('[data-confirm]')
  expect(mocks.confirmSwap).toHaveBeenCalledOnce()
  expect(mocks.closeReview).not.toHaveBeenCalled()
  expect(mocks.setParams).not.toHaveBeenCalled()
})

it('checks current Degen Mode after allowance resolves and ignores repeated clicks', async () => {
  let resolveAllowance = (_approved: boolean) => {}
  mocks.allowance.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveAllowance = resolve
      }),
  )
  mocks.degen = true
  await render()
  await click()
  await click()
  expect(mocks.allowance).toHaveBeenCalledOnce()
  mocks.degen = false
  await render()
  await act(async () => resolveAllowance(true))
  expect(mocks.openReview).not.toHaveBeenCalled()
  expect(mocks.setParams).toHaveBeenCalledOnce()
})

it('ignores allowance completion for a replaced quote', async () => {
  let resolveAllowance = (_approved: boolean) => {}
  mocks.allowance.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveAllowance = resolve
      }),
  )
  mocks.degen = true
  await render()
  await click()
  mocks.selectedQuote = { quote: { priceImpact: 12 } }
  mocks.degen = false
  await render()
  await act(async () => resolveAllowance(true))
  expect(mocks.openReview).not.toHaveBeenCalled()
  expect(mocks.setParams).not.toHaveBeenCalled()
})
