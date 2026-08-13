import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { Content, Header, Icon, OptionButton, Options, Section, Shell, Terms } from 'components/Header/web3/WalletModal'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { DerivationPaths } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { BitcoinToken } from 'pages/CrossChainSwap/adapters/types'
import { useNotify } from 'state/application/hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { cn } from 'utils/cn'

export const BitcoinConnectModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const [showLedgerType, setShowLedgerType] = useState(false)
  const notify = useNotify()

  const { walletInfo, availableWallets, connectingWallet, setConnectingWallet } = useBitcoinWallet()

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
    if (walletInfo.isConnected) {
      handleDismiss()
    }
  }, [handleDismiss, walletInfo.isConnected])

  if (walletInfo.isConnected) return null

  const ledgerWallet = availableWallets.find(wallet => wallet.name === 'Ledger')

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleDismiss}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
    >
      <Shell>
        <Section>
          <Header
            title={showLedgerType ? t`Select Derivation Path` : t`Connect your Bitcoin Wallet`}
            onClose={handleHeaderClose}
          />

          {showLedgerType ? (
            <Content>
              <div className="flex flex-col gap-4">
                {Object.entries(DerivationPaths).map(([name, path]) => {
                  return (
                    <OptionButton
                      key={name}
                      role="button"
                      connected={false}
                      className="gap-2"
                      onClick={() => {
                        ledgerWallet?.connect(path).catch(error => {
                          console.log('Error connecting Ledger wallet:', error)
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
                      }}
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
            </Content>
          ) : (
            <div className="flex flex-col gap-4">
              <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />
              <Content>
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
                      <OptionButton
                        key={wallet.type}
                        role="button"
                        onClick={isDisabled || isConnecting ? undefined : handleConnect}
                        connected={isConnecting}
                        isDisabled={isDisabled}
                        className={cn('justify-between', isConnecting && 'cursor-not-allowed hover:brightness-100')}
                      >
                        <div className="flex w-full items-center gap-2">
                          <Icon>
                            <img src={wallet.logo} alt={wallet.name} />
                          </Icon>
                          <span>{wallet.name}</span>
                          {isConnecting && <Loader className="text-white" />}
                        </div>
                        <span className="min-w-max text-xs font-normal">{wallet.isInstalled() && t`Detected`}</span>
                      </OptionButton>
                    )
                  })}
                </Options>
              </Content>
            </div>
          )}
        </Section>
      </Shell>
    </Modal>
  )
}
