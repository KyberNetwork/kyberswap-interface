import { t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import {
  Icon,
  OptionButton,
  Options,
  Terms,
  WalletModalShell,
  WalletOption,
} from 'components/Header/web3/WalletModal/components'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { DerivationPaths } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { useNotify } from 'state/application/hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { BitcoinToken } from 'types/crossChain'

export const BitcoinConnectModal = ({
  isOpen,
  onDismiss,
  allowWalletSwitch = false,
}: {
  isOpen: boolean
  onDismiss: () => void
  allowWalletSwitch?: boolean
}) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const [showLedgerType, setShowLedgerType] = useState(false)
  const notify = useNotify()

  const { walletInfo, availableWallets, connectingWallet, setConnectingWallet } = useBitcoinWallet()
  const initialWallet = useRef(walletInfo)
  const connectionComplete = walletInfo.isConnected && (!allowWalletSwitch || walletInfo !== initialWallet.current)

  const handleDismiss = useCallback(() => {
    setConnectingWallet(null)
    onDismiss()
  }, [onDismiss, setConnectingWallet])

  const handleHeaderClose = useCallback(() => {
    if (showLedgerType) {
      setShowLedgerType(false)
      return
    }
    handleDismiss()
  }, [handleDismiss, showLedgerType])

  useEffect(() => {
    if (isOpen && connectionComplete) {
      handleDismiss()
    }
  }, [handleDismiss, connectionComplete, isOpen])

  const ledgerWallet = availableWallets.find(wallet => wallet.name === 'Ledger')

  const connectLedger = (path: string) => {
    ledgerWallet?.connect(path).catch(error => {
      notify(
        {
          title: t`Error`,
          summary: error.message || t`Failed to connect Ledger wallet`,
          type: NotificationType.ERROR,
        },
        3000,
      )
    })
    setShowLedgerType(false)
  }

  if (connectionComplete) return null

  return (
    <WalletModalShell
      title={showLedgerType ? t`Select Derivation Path` : t`Connect your Bitcoin Wallet`}
      isOpen={isOpen}
      onClose={handleHeaderClose}
      onDismiss={handleDismiss}
    >
      {showLedgerType ? (
        <div className="flex flex-col gap-4">
          {Object.entries(DerivationPaths).map(([name, path]) => {
            return (
              <OptionButton
                key={name}
                role="button"
                connected={false}
                className="gap-2"
                onClick={() => connectLedger(path)}
              >
                <Icon>
                  <img src={BitcoinToken.logo} alt="" />
                </Icon>
                <span>{name}</span>
                <span className="truncate text-sm font-normal text-subText">{path}</span>
              </OptionButton>
            )
          })}
        </div>
      ) : (
        <>
          <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />

          <Options>
            {availableWallets.map(wallet => {
              const isConnecting = connectingWallet === wallet.type
              const isDisabled = !isAcceptedTerm || (connectingWallet !== null && !isConnecting)
              const handleConnect = () => {
                if (wallet.name === 'Ledger') {
                  setShowLedgerType(true)
                  return
                }
                wallet.connect()
              }

              return (
                <WalletOption
                  key={wallet.type}
                  name={wallet.name}
                  icon={wallet.logo}
                  detected={wallet.isInstalled()}
                  connected={isConnecting}
                  connecting={isConnecting}
                  isDisabled={isDisabled}
                  onClick={isDisabled || isConnecting ? undefined : handleConnect}
                />
              )
            })}
          </Options>
        </>
      )}
    </WalletModalShell>
  )
}
