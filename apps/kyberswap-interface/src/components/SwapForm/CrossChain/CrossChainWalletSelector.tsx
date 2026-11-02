import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogIn, LogOut, X } from 'react-feather'

import { ReactComponent as PasteIcon } from 'assets/svg/copy.svg'
import { ButtonLight } from 'components/Button'
import Wallet from 'components/Icons/Wallet'
import { Stack } from 'components/Stack'
import type { ReceiverWallet } from 'components/SwapForm/CrossChain/receiverWallet'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { NonEvmChain } from 'types/crossChain'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'

type Props = {
  chain: NonEvmChain
  wallet?: ReceiverWallet
  onConnect: () => void
  onDisconnect: () => void
} & (
  | { role: 'sender' }
  | {
      role: 'receiver'
      recipient: string
      pastedRecipient: string
      isPastedRecipient: boolean
      onSelectWallet: () => void
      onApply: (address: string) => void
    }
)

export const CrossChainWalletSelector = (props: Props) => {
  const { chain, wallet, onConnect, onDisconnect } = props
  const [showMenu, setShowMenu] = useState(false)
  const [draftAddress, setDraftAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pasteRequest = useRef(0)
  const closeMenu = () => {
    pasteRequest.current++
    setShowMenu(false)
  }
  useOnClickOutside(menuRef, showMenu ? closeMenu : undefined)
  useEffect(
    () => () => {
      pasteRequest.current++
    },
    [],
  )

  const address = wallet?.address
  const walletIcon = wallet?.icon
  const walletName = wallet?.name
  const isReceiver = props.role === 'receiver'
  const selectedAddress = props.role === 'receiver' ? props.recipient : address
  const showPasteIcon = props.role === 'receiver' && props.isPastedRecipient
  const displayAddress = (value: string) =>
    chain === NonEvmChain.Near && value.includes('.near') ? value : shortenHash(value)

  const toggleMenu = () => {
    if (!isReceiver && !address) {
      onConnect()
      return
    }
    pasteRequest.current++
    setDraftAddress(props.role === 'receiver' ? props.pastedRecipient : '')
    setShowMenu(open => !open)
  }
  const pasteAddress = async () => {
    const request = ++pasteRequest.current
    try {
      const value = await navigator.clipboard.readText()
      if (request !== pasteRequest.current) return
      setDraftAddress(value.replace(/\s+/g, ''))
    } catch {
      // Keep manual entry available when clipboard access is unavailable.
    }
    if (request === pasteRequest.current) inputRef.current?.focus()
  }

  const applyAddress = () => {
    if (!draftAddress) return
    if (props.role === 'receiver') props.onApply(draftAddress)
    closeMenu()
  }

  return (
    <>
      <div
        ref={menuRef}
        className="relative text-xs font-medium text-subText"
        onKeyDown={event => {
          if (event.key === 'Escape') closeMenu()
        }}
      >
        <button
          type="button"
          className="flex items-center gap-1 border-0 bg-transparent p-0 text-subText hover:text-text"
          aria-expanded={isReceiver || address ? showMenu : undefined}
          title={selectedAddress || undefined}
          onClick={toggleMenu}
        >
          {selectedAddress &&
            (showPasteIcon ? (
              <PasteIcon
                className="shrink-0 text-text [&_path]:stroke-current"
                strokeWidth={1}
                aria-label={t`Pasted receiver address`}
              />
            ) : walletIcon ? (
              <img src={walletIcon} alt={walletName || ''} className="size-4 shrink-0" />
            ) : (
              <Wallet size={16} className="shrink-0" />
            ))}
          <span className={cn('truncate', isReceiver ? 'max-w-48' : 'max-w-32')}>
            {selectedAddress ? displayAddress(selectedAddress) : <Trans>Select Wallet</Trans>}
          </span>
          <ChevronDown size={14} />
        </button>
        {showMenu && (
          <div
            data-wallet-menu
            className={cn(
              'absolute left-0 top-6 z-50 overflow-hidden rounded-lg bg-tableHeader shadow-lg',
              isReceiver ? 'w-[300px]' : 'w-64',
            )}
          >
            {address && (
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <button
                  type="button"
                  disabled={!isReceiver}
                  className="flex min-w-0 items-center gap-2 border-0 bg-transparent p-0 text-subText enabled:hover:text-text disabled:cursor-default"
                  onClick={() => {
                    if (props.role === 'receiver') props.onSelectWallet()
                    closeMenu()
                  }}
                >
                  {walletIcon && <img src={walletIcon} alt={walletName || ''} className="size-4 shrink-0" />}
                  <span className="truncate text-text" title={address}>
                    {displayAddress(address)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t`Disconnect wallet`}
                  title={t`Disconnect wallet`}
                  className="flex shrink-0 items-center justify-center rounded border-0 bg-transparent p-1 text-subText hover:bg-subText-20 hover:text-text"
                  onClick={() => {
                    closeMenu()
                    onDisconnect()
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            <Stack className="gap-1 p-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded border-0 bg-transparent p-2 text-left text-subText hover:bg-subText-20 hover:text-text"
                onClick={() => {
                  closeMenu()
                  onConnect()
                }}
              >
                <LogIn size={16} />
                {address ? <Trans>Connect new wallet</Trans> : <Trans>Connect a wallet</Trans>}
              </button>
              {isReceiver && (
                <Stack className="gap-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded border-0 bg-transparent p-2 text-left text-subText hover:bg-subText-20 hover:text-text"
                    onClick={pasteAddress}
                  >
                    <PasteIcon className="shrink-0 text-text [&_path]:stroke-current" strokeWidth={1} />
                    <Trans>Paste receiver address</Trans>
                  </button>
                  <div className="p-1 pt-0">
                    <div className="flex h-8 items-center gap-2 rounded-lg bg-buttonGray px-3 py-1">
                      <input
                        ref={inputRef}
                        aria-label={t`Receiver address`}
                        placeholder={t`Receiver address`}
                        autoComplete="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-text outline-none placeholder:text-subText"
                        value={draftAddress}
                        onChange={event => {
                          pasteRequest.current++
                          setDraftAddress(event.target.value.replace(/\s+/g, ''))
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            applyAddress()
                          }
                        }}
                      />
                      {draftAddress && (
                        <>
                          <button
                            type="button"
                            aria-label={t`Clear address`}
                            className="flex shrink-0 items-center border-0 bg-transparent p-0 text-subText hover:text-text"
                            onClick={() => {
                              pasteRequest.current++
                              setDraftAddress('')
                              inputRef.current?.focus()
                            }}
                          >
                            <X size={14} />
                          </button>
                          <ButtonLight
                            type="button"
                            className="w-fit shrink-0 rounded px-2 py-0.5"
                            fontSize={12}
                            onClick={applyAddress}
                          >
                            <Trans>Apply</Trans>
                          </ButtonLight>
                        </>
                      )}
                    </div>
                  </div>
                </Stack>
              )}
            </Stack>
          </div>
        )}
      </div>
    </>
  )
}
