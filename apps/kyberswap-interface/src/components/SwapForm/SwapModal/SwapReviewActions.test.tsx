// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ComponentProps, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import SwapReviewActions from './SwapReviewActions'

vi.mock('components/Button', () => {
  const Button = ({ children, onClick, disabled, id }: any) => (
    <button id={id} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
  return { ButtonPrimary: Button, ButtonOutlined: Button, ButtonError: Button }
})
vi.mock('components/ErrorWarning', () => ({ ErrorWarning: () => null }))
vi.mock('components/SlippageWarningNote', () => ({ default: () => null }))
vi.mock('components/SwapForm/Warnings/PriceImpactNote', () => ({ default: () => null }))
vi.mock('components/SwapForm/SwapModal/reviewData', () => ({
  AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD: -5,
  isSlippageBuildError: () => false,
}))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const confirm = vi.fn()
const render = (acceptNewAmount = false) =>
  act(async () => {
    const review: ComponentProps<typeof SwapReviewActions>['review'] = {
      parsedAmountIn: undefined,
      priceImpactFromBuild: 20,
      showWarningStyle: true,
      outputChangePercent: -20,
      isShowAcceptNewAmount: acceptNewAmount,
      honeypot: null,
      showReservedOrderWarning: false,
      reservedOrderLink: undefined,
      reservedStopMarketLink: undefined,
    }
    root.render(
      <I18nProvider i18n={i18n}>
        <SwapReviewActions
          review={review}
          slippage={50}
          defaultSlippage={50}
          isAdvancedMode={false}
          isBuildingRoute={false}
          buildError={undefined}
          hasAcceptedNewAmount={false}
          onConfirm={confirm}
        />
      </I18nProvider>,
    )
  })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  confirm.mockClear()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})
it('forwards a high-impact confirmation to the controller even with Degen Mode off', async () => {
  await render()
  const button = container.querySelector<HTMLButtonElement>('#confirm-swap-or-send')
  expect(button?.disabled).toBe(false)
  await act(async () => button?.click())
  expect(confirm).toHaveBeenCalledOnce()
})
it('still requires acceptance of a changed output amount', async () => {
  await render(true)
  const button = container.querySelector<HTMLButtonElement>('#confirm-swap-or-send')
  expect(button?.disabled).toBe(true)
  await act(async () => button?.click())
  expect(confirm).not.toHaveBeenCalled()
})
