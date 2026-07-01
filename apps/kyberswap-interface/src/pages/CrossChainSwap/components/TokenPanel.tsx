import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { formatUnits } from 'viem'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { Aligner, CurrencySelect, InputRow, StyledTokenName } from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Wallet from 'components/Icons/Wallet'
import NumericalInput from 'components/NumericalInput'
import { RowFixed } from 'components/Row'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import SelectNetwork from 'pages/Bridge/SelectNetwork'
import { Chain, Currency, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import TokenSelectorNonEvmModal from 'pages/CrossChainSwap/components/TokenSelectorNonEvmModal'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { isEvmChain, shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

export const TokenPanel = ({
  selectedChain,
  selectedCurrency,
  onSelectNetwork,
  value,
  amountUsd,
  onUserInput,
  disabled,
  onSelectCurrency,
  evmLayout,
  setShowBtcConnect,
  loading,
}: {
  evmLayout?: boolean
  setShowBtcConnect: (val: boolean) => void
  selectedChain?: Chain
  selectedCurrency?: Currency
  onSelectNetwork: (chainId: Chain) => void
  onSelectCurrency: (currency: Currency) => void
  value: string
  amountUsd?: number
  disabled: boolean
  onUserInput: (value: string) => void
  loading?: boolean
}) => {
  const { trackingHandler } = useTracking()
  const [modalOpen, setModalOpen] = useState(false)
  const isEvm = isEvmChain(selectedChain as Chain)
  const isSolana = selectedChain === NonEvmChain.Solana
  const isBitcoin = selectedChain === NonEvmChain.Bitcoin
  const isNear = selectedChain === NonEvmChain.Near

  // Balance sources for each chain family.
  const { balances } = useNearBalances()
  const solanaBalances = useSolanaTokenBalances()
  const { balance: btcBalance, walletInfo, availableWallets } = useBitcoinWallet()

  const evmBalance = useCurrencyBalance(
    isEvm ? (selectedCurrency as EvmCurrency) : undefined,
    isEvm ? (selectedChain as ChainId) : undefined,
  )

  // Wallet sources and modal actions.
  const { publicKey: solanaAddress, disconnect: solanaDisconnect } = useWallet()
  const { address: btcAddress } = walletInfo || {}
  const { signedAccountId: nearAddress, signOut: nearSignOut } = useWalletSelector()
  const { account: evmAddress } = useActiveWeb3React()

  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()
  const { setIsOpen } = useSolanaConnectModal()
  const toggleWalletModal = useWalletModalToggle()
  const disconnectWallet = useDisconnectWallet()

  const ref = useRef<{ toggleNetworkModal: () => void }>(null)
  const node = useRef<HTMLDivElement | null>(null)
  const [autoToggleTokenSelector, setAutoToggleTokenSelector] = useState(false)
  const [showMenu, toggleShowMenu] = useToggle(false)

  useOnClickOutside(node, showMenu ? toggleShowMenu : undefined)

  useEffect(() => {
    if (autoToggleTokenSelector && selectedChain) {
      setModalOpen(true)
      setAutoToggleTokenSelector(false)
    }
  }, [autoToggleTokenSelector, selectedChain])

  const selectedTokenId = (selectedCurrency as any)?.assetId || (selectedCurrency as any)?.id
  const selectedTokenDecimals = (selectedCurrency as any)?.decimals || (isBitcoin ? 8 : 18)

  const connectedAddress = isSolana
    ? solanaAddress?.toString()
    : isBitcoin
    ? btcAddress
    : isNear
    ? nearAddress
    : evmAddress
  const walletType = isSolana ? 'Solana' : isNear ? 'NEAR' : isBitcoin ? 'Bitcoin' : 'EVM'
  const walletDisplayAddress = connectedAddress
    ? isNear && connectedAddress.includes('.near')
      ? connectedAddress
      : shortenHash(connectedAddress)
    : t`Select Wallet`

  const handleWalletClick = () => {
    if (connectedAddress) {
      toggleShowMenu()
      return
    }

    trackingHandler(TRACKING_EVENT_TYPE.CC_WALLET_SELECTED, {
      wallet_type: walletType,
      chain: selectedChain,
    })

    if (isSolana) {
      setIsOpen(true)
    } else if (isNear) {
      onOpenWallet('near')
    } else if (isBitcoin) {
      setShowBtcConnect(true)
    } else {
      toggleWalletModal()
    }
  }

  const handleDisconnectWallet = async () => {
    if (isNear) nearSignOut()
    else if (isBitcoin) await availableWallets.find(wallet => wallet.type === walletInfo.walletType)?.disconnect?.()
    else if (isSolana) solanaDisconnect()
    else disconnectWallet()

    toggleShowMenu()
  }

  const getSelectedTokenBalance = () => {
    if (!connectedAddress) return '--'

    if (isSolana) {
      return formatDisplayNumber(solanaBalances[selectedTokenId]?.balance || 0, { significantDigits: 8 })
    }

    if (isNear || isBitcoin) {
      return formatDisplayNumber(
        formatUnits(
          isNear ? BigInt(balances[(selectedCurrency as any)?.assetId] || '0') : BigInt(btcBalance || '0'),
          selectedTokenDecimals,
        ),
        { significantDigits: 8 },
      )
    }

    return evmBalance?.toSignificant(6) || 0
  }

  const handleMaxBalanceClick = () => {
    if (disabled) return

    if (isNear) {
      onUserInput(formatUnits(BigInt(balances[(selectedCurrency as any)?.assetId] || '0'), selectedTokenDecimals))
      return
    }

    if (isBitcoin) {
      onUserInput(formatUnits(BigInt(btcBalance || '0'), 8))
      return
    }

    if (isSolana) {
      const b = solanaBalances[selectedTokenId]
      if (b) onUserInput(formatUnits(BigInt(b.rawAmount), b.decimals))
      return
    }

    onUserInput(evmBalance?.toExact() || '0')
  }

  const balanceSection = (
    <div
      className="flex w-fit cursor-pointer items-center gap-1 text-xs font-medium text-subText hover:text-text"
      role="button"
      onClick={handleMaxBalanceClick}
    >
      <Wallet className="text-subText" />
      {getSelectedTokenBalance()}
    </div>
  )

  return (
    <div className="rounded-2xl border border-transparent bg-buttonBlack p-4">
      <Stack className="gap-3">
        <div className="flex items-center justify-between">
          <SelectNetwork
            onSelectNetwork={onSelectNetwork}
            selectedChainId={selectedChain}
            chainIds={[NonEvmChain.Solana, NonEvmChain.Bitcoin, NonEvmChain.Near, ...MAINNET_NETWORKS]}
            ref={ref}
          />

          {evmLayout ? (
            balanceSection
          ) : (
            <div className="relative text-xs font-medium text-subText">
              <div
                role="button"
                className="flex cursor-pointer items-end gap-1 hover:brightness-125"
                onClick={handleWalletClick}
              >
                {walletDisplayAddress}
                <ChevronDown size={14} />
              </div>

              {showMenu && (
                <div
                  ref={node as React.RefObject<HTMLDivElement>}
                  className="absolute right-0 top-[24px] overflow-hidden rounded-lg bg-tableHeader"
                >
                  <span
                    role="button"
                    className="block px-4 py-2 hover:bg-subText-20 hover:text-text"
                    onClick={async e => {
                      e.preventDefault()
                      e.stopPropagation()
                      await handleDisconnectWallet()
                    }}
                  >
                    {t`Disconnect`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <Stack className="gap-1">
          <InputRow>
            {loading ? (
              <div style={{ flex: 1 }}>
                <Skeleton height="24px" width="160px" />
              </div>
            ) : (
              <NumericalInput
                error={false}
                className="token-amount-input"
                value={value}
                disabled={disabled}
                onUserInput={onUserInput}
              />
            )}

            {loading ? (
              <Skeleton height="20px" width="48px" />
            ) : (
              !!amountUsd && (
                <span className="text-sm font-medium text-border">
                  ~{formatDisplayNumber(amountUsd, { significantDigits: 4, style: 'currency' })}
                </span>
              )
            )}

            <CurrencySelect
              isDisable={isBitcoin}
              selected={!!selectedCurrency}
              onClick={() => {
                if (!selectedChain) {
                  ref?.current?.toggleNetworkModal()
                  setAutoToggleTokenSelector(true)
                  return
                }
                if (!isBitcoin) {
                  setModalOpen(true)
                }
              }}
            >
              <Aligner className="gap-1">
                <RowFixed className="gap-2">
                  {selectedCurrency && (
                    <>
                      {isEvm ? (
                        <CurrencyLogo currency={selectedCurrency as EvmCurrency} size={'20px'} />
                      ) : (
                        <img
                          src={(selectedCurrency as any).logo}
                          alt={selectedCurrency.symbol}
                          width={24}
                          height={24}
                          style={{ borderRadius: '50%' }}
                          onError={({ currentTarget }) => {
                            currentTarget.onerror = null
                            currentTarget.src = UnknownToken
                          }}
                        />
                      )}
                    </>
                  )}
                  <StyledTokenName
                    className="token-symbol-container"
                    active={Boolean(selectedCurrency?.symbol)}
                    style={{ paddingRight: 0 }}
                  >
                    {selectedCurrency?.symbol || t`Select a token`}
                  </StyledTokenName>
                </RowFixed>
                <DropdownSVG className="-mx-1" />
              </Aligner>
            </CurrencySelect>
          </InputRow>

          {!evmLayout && balanceSection}
        </Stack>
      </Stack>

      {isEvm ? (
        <TokenSelectorModal
          isOpen={modalOpen}
          onDismiss={() => setModalOpen(false)}
          onCurrencySelect={onSelectCurrency as (currency: Currency) => void}
          selectedCurrency={selectedCurrency as EvmCurrency}
          showPinnedTokens
          customChainId={selectedChain as ChainId}
          trackingSource="cross_chain"
        />
      ) : (
        <TokenSelectorNonEvmModal
          isOpen={modalOpen}
          onDismiss={() => setModalOpen(false)}
          onSelectCurrency={onSelectCurrency}
          nearBalances={balances}
          selectedChain={selectedChain}
          selectedCurrency={selectedCurrency}
          solanaBalances={solanaBalances}
        />
      )}

      {termAndPolicyModal}
    </div>
  )
}
