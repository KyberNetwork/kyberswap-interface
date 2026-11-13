// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { type ComponentProps, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import SwapActionButton from './index'

const mocks = vi.hoisted(() => ({ restoring: false, connect: vi.fn(), account: undefined as string | undefined }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: mocks.account, chainId: 1 }) }))
vi.mock('components/SwapForm/hooks/useV2Allowance', () => ({ default: () => false }))
vi.mock('hooks/useIsWalletRestoring', () => ({ default: () => mocks.restoring }))
vi.mock('state/application/hooks', () => ({ useWalletModalToggle: () => mocks.connect }))
vi.mock('hooks/useApproveCallback', () => ({
  ApprovalState: { APPROVED: 3 },
  useApproveCallback: () => [3, vi.fn()],
}))
vi.mock('hooks/usePermit', () => ({ PermitState: {}, usePermit: () => ({ permitState: 'unavailable' }) }))
vi.mock('hooks/useRestrictedTokens', () => ({ useIsTokenRestricted: () => () => false }))
vi.mock('hooks/useWrapCallback', () => ({ WrapType: { NOT_APPLICABLE: 0 } }))
vi.mock('hooks/useTheme', () => ({ default: () => ({}) }))
vi.mock('hooks/useTracking', () => ({ default: () => ({ trackingHandler: vi.fn() }), TRACKING_EVENT_TYPE: {} }))
vi.mock('hooks/web3/useChangeNetwork', () => ({ useChangeNetwork: () => ({ changeNetwork: vi.fn() }) }))
vi.mock('hooks/useChainsConfig', () => ({ NETWORKS_INFO: {} }))
vi.mock('utils/nativeErc20', () => ({ paysNativeOnSwap: () => false }))
vi.mock('components/Button', () => ({
  ButtonPrimary: (props: any) => <button {...props} />,
  ButtonLight: (props: any) => <button {...props} />,
  ButtonConfirmed: (props: any) => <button {...props} />,
}))
vi.mock('components/InfoHelper', () => ({ default: () => null }))
vi.mock('components/Loader', () => ({ default: () => null }))
vi.mock('components/Select', () => ({ default: () => null }))
vi.mock('components/Stack', () => ({ Stack: () => null, HStack: () => null }))
vi.mock('components/SwapForm/SingleChain/SingleChainSwapReview', () => ({ default: () => null }))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const render = (props: Partial<ComponentProps<typeof SwapActionButton>> = {}) =>
  act(async () => {
    root.render(
      <I18nProvider i18n={i18n}>
        <SwapActionButton
          {...({ review: { phase: 'closed' }, wrapType: 0, isGettingRoute: false } as ComponentProps<
            typeof SwapActionButton
          >)}
          {...props}
        />
      </I18nProvider>,
    )
  })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  mocks.restoring = false
  mocks.account = undefined
  mocks.connect.mockClear()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})
it.each(['wallet', 'tokens', 'quote'] as const)(
  'waits for %s before allowing connection, then unblocks',
  async state => {
    mocks.restoring = state === 'wallet'
    await render({ isCurrencyLoading: state === 'tokens', isGettingRoute: state === 'quote' })
    expect(container.querySelector('button')?.disabled).toBe(true)
    await act(async () => container.querySelector('button')?.click())
    expect(mocks.connect).not.toHaveBeenCalled()

    mocks.restoring = false
    await render()
    expect(container.querySelector('button')?.disabled).toBe(false)
    await act(async () => container.querySelector('button')?.click())
    expect(mocks.connect).toHaveBeenCalledTimes(1)
  },
)
it('does not replace a connected wrap action with the wallet restoration fallback', async () => {
  mocks.account = '0xconnected'
  mocks.restoring = true
  const wrap = vi.fn()
  await render({ wrapType: 1, onWrap: wrap })
  expect(container.querySelector('button')?.disabled).toBe(false)
  await act(async () => container.querySelector('button')?.click())
  expect(wrap).toHaveBeenCalledTimes(1)
  expect(mocks.connect).not.toHaveBeenCalled()
})
