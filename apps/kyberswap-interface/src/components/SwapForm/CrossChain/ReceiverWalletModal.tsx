import { t } from '@lingui/macro'
import { ReactNode, useEffect, useRef, useState } from 'react'

import { ButtonPrimary } from 'components/Button'
import {
  Icon,
  OptionButton,
  Options,
  Terms,
  WalletModalShell,
  WalletOption,
} from 'components/Header/web3/WalletModal/components'
import Loader from 'components/Loader'
import { ReceiverWalletOption } from 'components/SwapForm/CrossChain/hooks/useReceiverWalletOptions'
import type { SwapWalletConnection } from 'components/SwapForm/CrossChain/walletConnection'
import { DerivationPaths } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { Chain, NonEvmChain } from 'types/crossChain'

type Props = {
  chain: Chain
  onSelect: (wallet: SwapWalletConnection) => void
  onDismiss: () => void
  wallets: ReceiverWalletOption[]
  loading: boolean
  error: string
  connectionPrompt?: ReactNode
}

export const ReceiverWalletModal = ({
  chain,
  onSelect,
  onDismiss,
  wallets,
  loading,
  error: loadError,
  connectionPrompt,
}: Props) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()
  const [connecting, setConnecting] = useState('')
  const [error, setError] = useState('')
  const [hardware, setHardware] = useState<ReceiverWalletOption>()
  const [path, setPath] = useState("44'/397'/0'/0'/1'")
  const [accounts, setAccounts] = useState<SwapWalletConnection[]>([])
  const operation = useRef<symbol | null>(null)

  const dismiss = () => {
    operation.current = null
    onDismiss()
  }

  const selectAccount = (wallet: SwapWalletConnection) => {
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
      if (operation.current !== request) {
        // Closing or unmounting invalidates this request; release sessions nobody selected.
        result.forEach(connection => {
          void connection.release?.().catch(console.error)
        })
        return
      }

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
    <WalletModalShell title={hardware ? t`Select Derivation Path` : t`Connect your Wallet`} isOpen onDismiss={dismiss}>
      <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />
      {(error || loadError) && (
        <div role="alert" className="text-sm text-red">
          {error || loadError}
        </div>
      )}

      {connecting && connectionPrompt ? (
        connectionPrompt
      ) : loading ? (
        <Options loading />
      ) : accounts.length > 0 ? (
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
            <ButtonPrimary disabled={!!connecting || !path || !isAcceptedTerm} onClick={() => connect(hardware, path)}>
              {connecting ? <Loader /> : t`Continue`}
            </ButtonPrimary>
          </div>
        )
      ) : wallets.length ? (
        <Options>
          {wallets.map(wallet => (
            <WalletOption
              key={wallet.id}
              name={wallet.name}
              icon={wallet.icon}
              detected={wallet.installed}
              connected={connecting === wallet.id}
              connecting={connecting === wallet.id}
              isDisabled={!isAcceptedTerm || !!connecting}
              onClick={() => chooseWallet(wallet)}
            />
          ))}
        </Options>
      ) : !loadError ? (
        <div className="text-sm text-subText">{t`No wallet detected`}</div>
      ) : null}
    </WalletModalShell>
  )
}
