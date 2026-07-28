import { t } from '@lingui/macro'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react'
import { useCallback, useMemo } from 'react'

import { Content, Header, Icon, OptionButton, Options, Section, Shell, Terms } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
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
    <Modal
      isOpen={isOpen}
      onDismiss={handleClose}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock
      bypassFocusLock
      zindex={99999}
    >
      <Shell>
        <Section>
          <Header title={t`Connect your Wallet`} onClose={handleClose} />
          <div className="flex flex-col gap-4">
            <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />
            <Content>
              {listedWallets.length ? (
                <Options>
                  {listedWallets.map(({ name, icon }) => (
                    <OptionButton
                      key={name}
                      role="button"
                      id={`solana-connect-${name}`}
                      onClick={() => {
                        if (isAcceptedTerm) {
                          select(name)
                          handleClose()
                        }
                      }}
                      connected={false}
                      isDisabled={!isAcceptedTerm}
                    >
                      <Icon>
                        <img src={icon} alt={'Icon'} />
                      </Icon>
                      <span>{name}</span>
                    </OptionButton>
                  ))}
                </Options>
              ) : (
                <div className="rounded-2xl bg-buttonBlack/30 px-3 py-4 text-center text-sm font-medium text-subText">
                  {t`No Solana wallet detected`}
                </div>
              )}
            </Content>
          </div>
        </Section>
      </Shell>
    </Modal>
  )
}

export default SolanaConnectModal
