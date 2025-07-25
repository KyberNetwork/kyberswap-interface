import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useCallback, useState } from 'react'

import TermAndPolicy from 'pages/CrossChainSwap/components/TermAndPolicy'

export default function useAcceptTermAndPolicy() {
  const [termAndPolicyOpen, setTermAndPolicyOpen] = useState(false)
  const [openWallet, setOpenWallet] = useState<'solana' | 'near' | undefined>()

  const { setVisible: setModalVisible } = useWalletModal()
  const { signIn: nearSignIn } = useWalletSelector()

  const onCloseTermAndPolicy = useCallback(() => {
    setTermAndPolicyOpen(false)
    setOpenWallet(undefined)
  }, [])

  const onConfirmTermAndPolicy = useCallback(() => {
    if (!openWallet) return
    if (openWallet === 'solana') setModalVisible(true)
    else if (openWallet === 'near') nearSignIn()
    onCloseTermAndPolicy()
  }, [nearSignIn, openWallet, setModalVisible, onCloseTermAndPolicy])

  const onOpenWallet = useCallback((wallet: 'solana' | 'near') => {
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
