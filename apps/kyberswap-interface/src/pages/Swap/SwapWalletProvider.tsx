import type { WalletSelector } from '@near-wallet-selector/core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { ReactNode, Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useConfig } from 'wagmi'

import {
  evmConnection,
  selectEvmAppConnection,
  watchEvmAppConnection,
} from 'components/SwapForm/CrossChain/readEvmReceiver'
import { clearReturnedNearReceiver, getReturnedNearReceiver } from 'components/SwapForm/CrossChain/receiverWallet'
import {
  SwapWalletConnection,
  WalletFamily,
  bitcoinConnection,
  nearConnection,
  noSubscription,
  solanaConnection,
  walletFamily,
} from 'components/SwapForm/CrossChain/walletConnection'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { Chain, NonEvmChain } from 'types/crossChain'

import { SwapWalletContext } from './SwapWalletContext'

const WalletModal = lazy(() =>
  import('components/SwapForm/CrossChain/CrossChainReceiverWalletModal').then(module => ({
    default: module.CrossChainReceiverWalletModal,
  })),
)
const emptyAddress = () => ''

type Side = 'input' | 'output'
type Slot = { family: WalletFamily; connection?: SwapWalletConnection }
type Connections = { input?: Slot; output?: Slot }

// Adapt app sessions into the same live-connection interface used by independently selected wallets.
const useDefaultConnections = () => {
  const config = useConfig()
  const { account } = useActiveWeb3React()
  const { connector } = useWeb3React()
  const solana = useWallet()
  const near = useWalletSelector()
  const bitcoin = useBitcoinWallet()
  const [selector, setSelector] = useState<WalletSelector>()

  useEffect(() => {
    let cancelled = false

    near.walletSelector
      ?.then(value => {
        if (!cancelled) setSelector(value)
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [near.walletSelector])

  return useMemo<Partial<Record<WalletFamily, SwapWalletConnection>>>(() => {
    const session = connector && config.state.connections.get(connector.uid)

    return {
      evm: account && connector && session ? evmConnection(connector, config, session) : undefined,
      solana: solana.wallet?.adapter ? solanaConnection(solana.wallet.adapter) : undefined,
      near:
        near.wallet && near.signedAccountId && selector
          ? nearConnection(near.wallet, near.signedAccountId, selector)
          : undefined,
      bitcoin: bitcoin.connection && bitcoin.walletInfo.address ? bitcoinConnection(bitcoin.connection) : undefined,
    }
  }, [
    account,
    connector,
    config,
    solana.wallet?.adapter,
    near.wallet,
    near.signedAccountId,
    selector,
    bitcoin.connection,
    bitcoin.walletInfo,
  ])
}

type Props = { inputChain: Chain; outputChain: Chain; children: ReactNode }
/**
 * Owns the two signing slots for non-EVM cross-chain routes. Reverse changes slot
 * roles synchronously; it does not reconnect, load, or mutate pasted addresses.
 */
export const SwapWalletProvider = ({ inputChain, outputChain, children }: Props) => {
  const defaults = useDefaultConnections()
  const config = useConfig()
  const openAppWallet = useWalletModalToggle()
  const [connections, setConnections] = useState<Connections>({})
  const [connecting, setConnecting] = useState<{ side: Side; chain: Chain; onConnected?: () => void }>()
  const revision = useRef(0)
  const ownedConnections = useRef(new Set<SwapWalletConnection>())

  const inputFamily = walletFamily(inputChain)
  const outputFamily = walletFamily(outputChain)

  // EVM input always follows the app; reverse promotes the retained EVM receiver there.
  // Non-EVM slots override defaults, including explicitly disconnected/empty slots.
  const input =
    inputFamily === 'evm'
      ? defaults.evm
      : connections.input?.family === inputFamily
      ? connections.input.connection
      : connections.input
      ? undefined
      : defaults[inputFamily]
  const output = connections.output?.family === outputFamily ? connections.output.connection : undefined
  const inputAddress = useSyncExternalStore(
    input?.subscribe ?? noSubscription,
    input?.getAddress ?? emptyAddress,
    input?.getAddress ?? emptyAddress,
  )
  const outputAddress = useSyncExternalStore(
    output?.subscribe ?? noSubscription,
    output?.getAddress ?? emptyAddress,
    output?.getAddress ?? emptyAddress,
  )

  const select = (side: Side, chain: Chain, connection?: SwapWalletConnection) => {
    revision.current++

    if (side === 'input' && walletFamily(chain) === 'evm') {
      if (connection?.family === 'evm') connection.selectAppConnection()
      else selectEvmAppConnection(config)
    }

    if (connection) ownedConnections.current.add(connection)
    setConnections(previous => ({ ...previous, [side]: { family: walletFamily(chain), connection } }))
  }

  const reverseConnections = () => {
    revision.current++
    setConnecting(undefined)

    // EVM-to-EVM routes have no independent receiver panel, even across chains.
    if (inputFamily === 'evm' && outputFamily === 'evm') return
    if (outputFamily === 'evm') {
      if (output?.family === 'evm') output.selectAppConnection()
      else selectEvmAppConnection(config)
    }

    // Keep the provider/session object with its slot. This preserves Ledger
    // transport and derivation path across repeated reversals.
    setConnections({
      input: { family: outputFamily, connection: output },
      output: { family: inputFamily, connection: input },
    })
  }

  // Retained sessions must keep their listeners while hidden by the current pair.
  useEffect(() => {
    const retained = new Set([connections.input?.connection, connections.output?.connection])
    const unsubscribe = [...retained].map(connection => connection?.subscribe(() => undefined))

    for (const connection of ownedConnections.current) {
      if (connection === connections.input?.connection || connection === connections.output?.connection) continue

      ownedConnections.current.delete(connection)
      void connection.release?.().catch(console.error)
    }

    return () => unsubscribe.forEach(stop => stop?.())
  }, [connections])

  useEffect(() => watchEvmAppConnection(config), [config])

  // Release the remaining owned sessions when the provider unmounts.
  useEffect(() => {
    const owned = ownedConnections.current

    return () => {
      owned.forEach(connection => {
        void connection.release?.().catch(console.error)
      })
      owned.clear()
    }
  }, [])

  // A pair change invalidates both the open modal and any pending NEAR restoration.
  useEffect(() => {
    revision.current++
    setConnecting(undefined)
  }, [inputChain, outputChain])

  // Restore a signing session after the browser redirect, unless the user has since changed intent.
  useEffect(() => {
    const returned = getReturnedNearReceiver()
    if (!returned) return

    let cancelled = false
    const request = revision.current

    import('components/SwapForm/CrossChain/hooks/useReceiverWalletOptions')
      .then(async ({ createNearReceiverSelector }) => {
        const selector = await createNearReceiverSelector()
        const wallet = await selector.wallet(returned.id)
        const accounts = await wallet.getAccounts()
        if (
          cancelled ||
          request !== revision.current ||
          !accounts.some(account => account.accountId === returned.address)
        )
          return

        // Restore the SDK's account store too; receiver state never contains an address-only substitute.
        if (wallet.type !== 'browser') return
        await wallet.signIn({ contractId: '' })
        if (cancelled || request !== revision.current) return

        setConnections(previous => ({
          ...previous,
          [returned.side ?? 'output']: {
            family: NonEvmChain.Near,
            connection: nearConnection(wallet, returned.address, selector),
          },
        }))
        clearReturnedNearReceiver()
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SwapWalletContext.Provider
      value={{
        inputConnection: input,
        outputConnection: output,
        inputAddress,
        outputAddress,
        connectInput: () =>
          inputFamily === 'evm' ? openAppWallet() : setConnecting({ side: 'input', chain: inputChain }),
        connectOutput: onConnected => setConnecting({ side: 'output', chain: outputChain, onConnected }),
        disconnectInput: () => select('input', inputChain),
        disconnectOutput: () => select('output', outputChain),
        reverseConnections,
      }}
    >
      {children}
      {connecting && connecting.chain === (connecting.side === 'input' ? inputChain : outputChain) && (
        <Suspense fallback={null}>
          <WalletModal
            key={`${connecting.side}:${connecting.chain}`}
            chain={connecting.chain}
            side={connecting.side}
            onSelect={connection => {
              select(connecting.side, connecting.chain, connection)
              connecting.onConnected?.()
            }}
            onDismiss={() => setConnecting(undefined)}
          />
        </Suspense>
      )}
    </SwapWalletContext.Provider>
  )
}
