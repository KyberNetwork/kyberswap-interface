import { useEffect, useEffectEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useSwapWallets } from 'pages/Swap/SwapWalletContext'
import useAcceptTermAndPolicy from 'pages/Swap/crossChain/hooks/useAcceptTermAndPolicy'
import { useSolanaConnectModal } from 'pages/Swap/crossChain/provider/SolanaConnectModalProvider'
import { type Chain, NonEvmChain } from 'types/crossChain'

/** Consume the explicit wallet-connect intent supplied by the header's non-EVM links. */
export const useCrossChainWalletIntent = (chain: Chain, onConnectBitcoin: () => void) => {
  const wallets = useSwapWallets()
  const [params, setParams] = useSearchParams()
  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()
  const { setIsOpen } = useSolanaConnectModal()
  const connect = useEffectEvent(() => {
    if (wallets) wallets.connectInput()
    else if (chain === NonEvmChain.Bitcoin) onConnectBitcoin()
    else if (chain === NonEvmChain.Near) onOpenWallet('near')
    else if (chain === NonEvmChain.Solana) setIsOpen(true)
  })
  useEffect(() => {
    if (!params.has('showConnect')) return
    connect()
    const next = new URLSearchParams(params)
    next.delete('showConnect')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Effect Event reads the current wallet actions.
  }, [params, setParams])
  return termAndPolicyModal
}
