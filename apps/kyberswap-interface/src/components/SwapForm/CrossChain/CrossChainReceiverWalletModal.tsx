import { t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'

import { ButtonPrimary } from 'components/Button'
import { Content, Header, Icon, OptionButton, Options, Section, Shell, Terms } from 'components/Header/web3/WalletModal'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import {
  ReceiverWalletOption,
  useReceiverWalletOptions,
} from 'components/SwapForm/CrossChain/hooks/useReceiverWalletOptions'
import type { ReceiverWallet } from 'components/SwapForm/CrossChain/receiverWallet'
import { DerivationPaths } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { NonEvmChain } from 'types/crossChain'

export const CrossChainReceiverWalletModal = ({
  chain,
  onSelect,
  onDismiss,
}: {
  chain: NonEvmChain
  onSelect: (wallet: ReceiverWallet) => void
  onDismiss: () => void
}) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()
  const { wallets, loading, error: loadError } = useReceiverWalletOptions(chain)
  const [connecting, setConnecting] = useState('')
  const [error, setError] = useState('')
  const [hardware, setHardware] = useState<ReceiverWalletOption>()
  const [path, setPath] = useState("44'/397'/0'/0'/1'")
  const [accounts, setAccounts] = useState<ReceiverWallet[]>([])
  const operation = useRef<symbol | null>(null)

  const dismiss = () => {
    operation.current = null
    onDismiss()
  }
  const selectAccount = (wallet: ReceiverWallet) => {
    operation.current = null
    onSelect(wallet)
    onDismiss()
  }
  const connect = async (wallet: ReceiverWalletOption, derivationPath?: string) => {
    if (!isAcceptedTerm || operation.current) return
    const request = Symbol()
    operation.current = request
    setConnecting(wallet.id)
    setError('')
    try {
      const result = await wallet.connect(derivationPath)
      if (operation.current !== request) return
      if (result.length === 1) selectAccount(result[0])
      else setAccounts(result)
    } catch (reason) {
      if (operation.current === request) setError(reason.message || t`Failed to connect wallet`)
    } finally {
      if (operation.current === request) {
        operation.current = null
        setConnecting('')
      }
    }
  }
  const chooseWallet = (wallet: ReceiverWalletOption) => {
    if (!isAcceptedTerm || operation.current) return
    if (wallet.hardware) setHardware(wallet)
    else void connect(wallet)
  }

  useEffect(
    () => () => {
      operation.current = null
    },
    [],
  )

  return (
    <Modal
      isOpen
      onDismiss={dismiss}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock
      bypassFocusLock
      zindex={99999}
    >
      <Shell>
        <Section>
          <Header title={hardware ? t`Select Derivation Path` : t`Connect your Wallet`} onClose={dismiss} />
          <div className="flex flex-col gap-4">
            <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />
            {loading && <Loader />}
            {(error || loadError) && (
              <div role="alert" className="text-sm text-red">
                {error || loadError}
              </div>
            )}
            <Content>
              {accounts.length > 0 ? (
                <Options>
                  {accounts.map(account => (
                    <OptionButton key={account.address} onClick={() => selectAccount(account)} connected={false}>
                      <Icon>
                        <img src={account.icon} alt="" />
                      </Icon>
                      <span className="truncate">{account.address}</span>
                    </OptionButton>
                  ))}
                </Options>
              ) : hardware ? (
                chain === NonEvmChain.Bitcoin ? (
                  <Options>
                    {Object.entries(DerivationPaths).map(([name, value]) => (
                      <OptionButton
                        key={value}
                        onClick={() => connect(hardware, value)}
                        isDisabled={!!connecting}
                        connected={false}
                      >
                        <span>{name}</span>
                        <span className="text-xs text-subText">{value}</span>
                      </OptionButton>
                    ))}
                  </Options>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input
                      aria-label={t`Derivation path`}
                      value={path}
                      onChange={event => setPath(event.target.value)}
                      className="rounded-lg border border-border bg-buttonGray p-3 text-sm text-text outline-none"
                    />
                    <ButtonPrimary
                      disabled={!!connecting || !path || !isAcceptedTerm}
                      onClick={() => connect(hardware, path)}
                    >
                      {connecting ? <Loader /> : t`Continue`}
                    </ButtonPrimary>
                  </div>
                )
              ) : wallets.length ? (
                <Options>
                  {wallets.map(wallet => (
                    <OptionButton
                      key={wallet.id}
                      onClick={() => chooseWallet(wallet)}
                      connected={connecting === wallet.id}
                      isDisabled={!isAcceptedTerm || !!connecting}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon>
                          <img src={wallet.icon} alt="" />
                        </Icon>
                        <span>{wallet.name}</span>
                        {connecting === wallet.id && <Loader />}
                      </div>
                      {wallet.installed && <span className="text-xs text-subText">{t`Detected`}</span>}
                    </OptionButton>
                  ))}
                </Options>
              ) : !loading && !loadError ? (
                <div className="text-sm text-subText">{t`No wallet detected`}</div>
              ) : null}
            </Content>
          </div>
        </Section>
      </Shell>
    </Modal>
  )
}
