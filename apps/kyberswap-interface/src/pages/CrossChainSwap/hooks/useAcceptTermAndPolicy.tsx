import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useCallback, useState } from 'react'

import TermAndPolicy from 'pages/CrossChainSwap/components/TermAndPolicy'

export default function useAcceptTermAndPolicy() {
  const [termAndPolicyOpen, setTermAndPolicyOpen] = useState(false)
  const [openWallet, setOpenWallet] = useState<'near' | undefined>()

  const { signIn: nearSignIn } = useWalletSelector()

  const onCloseTermAndPolicy = useCallback(() => {
    setTermAndPolicyOpen(false)
    setOpenWallet(undefined)
  }, [])

  const onConfirmTermAndPolicy = useCallback(() => {
    if (!openWallet) return
    if (openWallet === 'near') nearSignIn()
    onCloseTermAndPolicy()
  }, [openWallet, nearSignIn, onCloseTermAndPolicy])

  const onOpenWallet = useCallback((wallet: 'near') => {
    setOpenWallet(wallet)
    setTermAndPolicyOpen(true)
  }, [])

  const termAndPolicyModal = (
    <TermAndPolicy isOpen={termAndPolicyOpen} onClose={onCloseTermAndPolicy} onConfirm={onConfirmTermAndPolicy} />
  )

  return {
    termAndPolicyModal,
    onOpenWallet,
  }
}
