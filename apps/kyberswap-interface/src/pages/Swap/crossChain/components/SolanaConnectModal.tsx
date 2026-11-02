import { t } from '@lingui/macro'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react'
import { useCallback, useMemo } from 'react'

import { Options, Terms, WalletModalShell, WalletOption } from 'components/Header/web3/WalletModal/components'
import { useSolanaConnectModal } from 'pages/Swap/crossChain/provider/SolanaConnectModalProvider'
import { useIsAcceptedTerm } from 'state/user/hooks'

const SolanaConnectModal = () => {
  const { isOpen, setIsOpen } = useSolanaConnectModal()
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()
  const { select } = useWallet()

  const adaptersWithStandardAdapters = useStandardWalletAdapters([])

  const listedWallets = useMemo(
    () =>
      adaptersWithStandardAdapters.filter(
        adapter => adapter.readyState === WalletReadyState.Installed && adapter.name !== 'HOT Wallet',
      ),
    [adaptersWithStandardAdapters],
  )

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen])

  return (
    <WalletModalShell isOpen={isOpen} onDismiss={handleClose}>
      <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />

      {listedWallets.length ? (
        <Options>
          {listedWallets.map(({ name, icon }) => (
            <WalletOption
              key={name}
              id={`solana-connect-${name}`}
              name={name}
              icon={icon}
              isDisabled={!isAcceptedTerm}
              onClick={() => {
                if (!isAcceptedTerm) return
                select(name)
                handleClose()
              }}
            />
          ))}
        </Options>
      ) : (
        <div className="rounded-2xl bg-buttonBlack/30 px-3 py-4 text-center text-sm font-medium text-subText">
          {t`No Solana wallet detected`}
        </div>
      )}
    </WalletModalShell>
  )
}

export default SolanaConnectModal
