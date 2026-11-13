// @vitest-environment happy-dom
import { ChainId } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import { NETWORKS_INFO } from 'constants/networks'

import { KYBER_SWAP_RPC } from './AddMEVProtectionModal'
import MEVProtection from './MEVProtection'

const wallet = vi.hoisted(() => ({ chainId: 1, addNetwork: vi.fn() }))
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ chainId: wallet.chainId, walletKey: 'metamask' }),
  useWeb3React: () => ({ active: true }),
}))
vi.mock('components/Web3Provider', () => ({ CONNECTION: { METAMASK_RDNS: 'metamask' } }))
vi.mock('hooks/web3/useChangeNetwork', () => ({ useChangeNetwork: () => ({ addNewNetwork: wallet.addNetwork }) }))
vi.mock('hooks/useTracking', () => ({ default: () => ({ trackingHandler: vi.fn() }), TRACKING_EVENT_TYPE: {} }))
vi.mock('hooks/usePageLocation', () => ({ default: () => ({ isEmbeddedSwap: false }) }))
vi.mock('state/application/hooks', () => ({ useNotify: () => vi.fn() }))
vi.mock('react-use', () => ({ useMedia: () => false }))
vi.mock('react-device-detect', () => ({ isMobile: false, isTablet: false }))
vi.mock('components/Modal', () => ({
  default: ({ isOpen, children }: any) => (isOpen ? <div role="dialog">{children}</div> : null),
}))
vi.mock('components/Button', () => ({
  ButtonPrimary: (props: any) => <button {...props} />,
  ButtonOutlined: (props: any) => <button {...props} />,
}))
vi.mock('components/Copy', () => ({ default: () => null }))
vi.mock('components/InfoHelper', () => ({ default: () => null }))

it('uses the form chain for eligibility, displayed RPC and wallet requests, and closes on pair-chain changes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  const container = document.createElement('div')
  const root = createRoot(container)
  const render = (chainId: ChainId) =>
    act(async () =>
      root.render(
        <I18nProvider i18n={i18n}>
          <MEVProtection chainId={chainId} />
        </I18nProvider>,
      ),
    )
  try {
    await render(ChainId.BSCMAINNET)
    await act(async () => container.querySelector('button')?.click())
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain(KYBER_SWAP_RPC[ChainId.BSCMAINNET])
    wallet.chainId = ChainId.BASE
    await render(ChainId.BSCMAINNET)
    await act(async () =>
      Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent === 'Yes')
        ?.click(),
    )
    expect(wallet.addNetwork).toHaveBeenCalledWith(
      ChainId.BSCMAINNET,
      KYBER_SWAP_RPC[ChainId.BSCMAINNET],
      expect.objectContaining({ name: `${NETWORKS_INFO[ChainId.BSCMAINNET].name} (KyberSwap RPC)` }),
      expect.any(Function),
      expect.any(Function),
    )
    await render(ChainId.MAINNET)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    wallet.chainId = ChainId.MAINNET
    await render(ChainId.BASE)
    expect(container.querySelector('button')).toBeNull()
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})
