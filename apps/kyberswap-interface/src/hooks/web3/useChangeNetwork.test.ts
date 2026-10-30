import { ChainId } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useChangeNetwork } from './useChangeNetwork'
import { deferWalletChainSync, syncWalletChain } from './walletChainSync'

const mocks = vi.hoisted(() => ({
  active: true,
  dispatch: vi.fn(),
  notify: vi.fn(),
  switchChainAsync: vi.fn(),
}))

vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ chainId: 1, isWrongNetwork: false }),
  useWeb3React: () => ({ chainId: 1, active: mocks.active }),
}))
vi.mock('wagmi', () => ({ useSwitchChain: () => ({ switchChainAsync: mocks.switchChainAsync }) }))
vi.mock('state/hooks', () => ({ useAppDispatch: () => mocks.dispatch }))
vi.mock('state/application/hooks', () => ({ useNotify: () => mocks.notify }))
vi.mock('state/user/actions', () => ({ updateChainId: (chainId: number) => ({ type: 'chain', payload: chainId }) }))
vi.mock('constants/networks', () => ({ NETWORKS_INFO: { 1: { name: 'Ethereum' }, 8453: { name: 'Base' } } }))
vi.mock('utils/errorMessage', () => ({ friendlyError: (message: string) => message }))
vi.mock('utils/walletClient', () => ({ getGatedWalletClient: vi.fn() }))
vi.mock('utils/walletError', () => ({ didUserReject: () => true }))

const readChangeNetwork = () => {
  let result: ReturnType<typeof useChangeNetwork> | undefined
  const Probe = () => {
    result = useChangeNetwork()
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  if (!result) throw new Error('Hook did not render')
  return result.changeNetwork
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.active = true
})

describe('network switch and destination ordering', () => {
  it('holds an early wallet event until the success callback can select the destination pair', async () => {
    let resolveSwitch!: () => void
    mocks.switchChainAsync.mockImplementation(() => new Promise<void>(resolve => (resolveSwitch = resolve)))
    const navigateToPair = vi.fn()
    const walletSync = vi.fn(() => mocks.dispatch({ type: 'chain', payload: ChainId.BASE }))

    const switching = readChangeNetwork()(ChainId.BASE, navigateToPair)
    // The provider observes chainChanged while the wallet RPC is still pending.
    syncWalletChain(walletSync)
    await Promise.resolve()
    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(navigateToPair).not.toHaveBeenCalled()

    resolveSwitch()
    await switching

    expect(navigateToPair).toHaveBeenCalledOnce()
    expect(mocks.dispatch.mock.calls[0]).toEqual([{ type: 'chain', payload: ChainId.BASE }])
    expect(mocks.dispatch.mock.invocationCallOrder[0]).toBeLessThan(navigateToPair.mock.invocationCallOrder[0])
    expect(navigateToPair.mock.invocationCallOrder[0]).toBeLessThan(walletSync.mock.invocationCallOrder[0])
  })

  it('does not navigate on rejection and resumes wallet sync afterward', async () => {
    mocks.switchChainAsync.mockRejectedValue(new Error('User rejected'))
    const navigateToPair = vi.fn()
    const onFailure = vi.fn()

    await readChangeNetwork()(ChainId.BASE, navigateToPair, onFailure)

    expect(navigateToPair).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledOnce()
    const walletSync = vi.fn()
    syncWalletChain(walletSync)
    expect(walletSync).toHaveBeenCalledOnce()
  })

  it('replays the actual wallet chain if a wallet emits an event and then rejects the request', async () => {
    const walletSync = vi.fn()
    mocks.switchChainAsync.mockImplementation(async () => {
      syncWalletChain(walletSync)
      throw new Error('Wallet request failed after chainChanged')
    })
    const navigateToPair = vi.fn()

    await readChangeNetwork()(ChainId.BASE, navigateToPair)

    expect(navigateToPair).not.toHaveBeenCalled()
    expect(walletSync).toHaveBeenCalledOnce()
  })

  it('selects the chain and pair without a wallet RPC when disconnected', async () => {
    mocks.active = false
    const navigateToPair = vi.fn()

    await readChangeNetwork()(ChainId.BASE, navigateToPair)

    expect(mocks.switchChainAsync).not.toHaveBeenCalled()
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'chain', payload: ChainId.BASE })
    expect(navigateToPair).toHaveBeenCalledOnce()
  })

  it('navigates immediately when already on the target chain', async () => {
    const navigateToPair = vi.fn()

    await readChangeNetwork()(ChainId.MAINNET, navigateToPair)

    expect(mocks.switchChainAsync).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(navigateToPair).toHaveBeenCalledOnce()
  })

  it('keeps only the latest wallet event until all overlapping switches settle', () => {
    const resumeFirst = deferWalletChainSync()
    const resumeSecond = deferWalletChainSync()
    const firstSync = vi.fn()
    const latestSync = vi.fn()

    syncWalletChain(firstSync)
    syncWalletChain(latestSync)
    resumeFirst()
    resumeFirst()
    expect(latestSync).not.toHaveBeenCalled()
    resumeSecond()

    expect(firstSync).not.toHaveBeenCalled()
    expect(latestSync).toHaveBeenCalledOnce()
  })
})
