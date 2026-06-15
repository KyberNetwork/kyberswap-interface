import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { HTMLAttributes, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { formatUnits } from 'viem'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import HelpIcon from 'assets/svg/help-circle.svg'
import { Aligner, CurrencySelect, InputRow, StyledTokenName } from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Wallet from 'components/Icons/Wallet'
import Modal from 'components/Modal'
import { Input as NumericalInput } from 'components/NumericalInput'
import { RowFixed } from 'components/Row'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { SearchIcon, SearchInput, SearchWrapper, Separator } from 'components/TokenSelectorModal/components'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import SelectNetwork from 'pages/Bridge/SelectNetwork'
import { BitcoinToken, Chain, Currency, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
import { useWalletModalToggle } from 'state/application/hooks'
import { useNearTokens, useSolanaTokens } from 'state/crossChainSwap'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { CloseIcon } from 'theme'
import { isEvmChain, shortenHash } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const TokenRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex h-14 cursor-pointer items-center justify-between gap-4 px-5 py-1 data-[selected=true]:bg-bg6/15 [@media(hover:hover)]:hover:bg-buttonBlack',
      className,
    )}
    {...rest}
  />
)
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
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const [modalOpen, setModalOpen] = useState(false)
  const isEvm = isEvmChain(selectedChain as Chain)
  const { nearTokens } = useNearTokens()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const deboundcedSearchQuery = useDebounce(searchQuery, 300)

  const { solanaTokens } = useSolanaTokens(deboundcedSearchQuery)

  const evmBalance = useCurrencyBalance(
    isEvm ? (selectedCurrency as EvmCurrency) : undefined,
    isEvm ? (selectedChain as ChainId) : undefined,
  )

  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()
  const { setIsOpen } = useSolanaConnectModal()

  const balance = evmBalance

  const ref = useRef<{ toggleNetworkModal: () => void }>(null)
  const [autoToggleTokenSelector, setAutoToggleTokenSelector] = useState(false)
  useEffect(() => {
    if (autoToggleTokenSelector && selectedChain) {
      setModalOpen(true)
      setAutoToggleTokenSelector(false)
    }
  }, [autoToggleTokenSelector, selectedChain])

  const inputRef = useRef<HTMLInputElement>(null)

  const tokenOnNears = useMemo(
    () =>
      nearTokens.filter(token => {
        return token.blockchain === 'near'
      }),
    [nearTokens],
  )

  const solanaBalances = useSolanaTokenBalances()

  const { publicKey: solanaAddress, disconnect: solanaDisconnect } = useWallet()

  // clear the input on open
  useEffect(() => {
    if (modalOpen) {
      setSearchQuery('')
      inputRef.current?.focus()
    }
  }, [modalOpen])

  const filteredTokens =
    selectedChain === NonEvmChain.Solana
      ? solanaTokens
          .map(token => ({ ...token, assetId: token.id }))
          .sort((a, b) => {
            return solanaBalances[a.id]?.balance > solanaBalances[b.id]?.balance ? -1 : 1
          })
      : selectedChain === NonEvmChain.Bitcoin
      ? [
          {
            ...BitcoinToken,
            assetId: BitcoinToken.symbol,
          },
        ]
      : tokenOnNears.filter(
          token =>
            token.symbol.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            token.contractAddress.toLowerCase().includes(searchQuery.trim().toLowerCase()),
        )

  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile

  const { balances } = useNearBalances()

  const { balance: btcBalance, walletInfo, availableWallets } = useBitcoinWallet()
  const { address: btcAddress } = walletInfo || {}
  const { signedAccountId: nearAddress, signOut: nearSignOut } = useWalletSelector()
  const { account: evmAddress } = useActiveWeb3React()

  const connectedAddress =
    selectedChain === NonEvmChain.Solana
      ? solanaAddress?.toString()
      : selectedChain === NonEvmChain.Bitcoin
      ? btcAddress
      : selectedChain === NonEvmChain.Near
      ? nearAddress
      : evmAddress

  const toggleWalletModal = useWalletModalToggle()
  const [showMenu, toggleShowMenu] = useToggle(false)

  const node = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(node, showMenu ? toggleShowMenu : undefined)

  const disconnectWallet = useDisconnectWallet()

  const handleWalletClick = () => {
    if (connectedAddress) {
      toggleShowMenu()
      return
    }

    const walletType =
      selectedChain === NonEvmChain.Solana
        ? 'Solana'
        : selectedChain === NonEvmChain.Near
        ? 'NEAR'
        : selectedChain === NonEvmChain.Bitcoin
        ? 'Bitcoin'
        : 'EVM'
    trackingHandler(TRACKING_EVENT_TYPE.CC_WALLET_SELECTED, {
      wallet_type: walletType,
      chain: selectedChain,
    })

    if (selectedChain === NonEvmChain.Solana) {
      setIsOpen(true)
    } else if (selectedChain === NonEvmChain.Near) {
      onOpenWallet('near')
    } else if (selectedChain === NonEvmChain.Bitcoin) {
      setShowBtcConnect(true)
    } else {
      toggleWalletModal()
    }
  }

  const balanceSection = (
    <div
      className="flex cursor-pointer items-center gap-1 text-xs font-medium text-subText"
      role="button"
      onClick={() => {
        if (disabled) return
        if (selectedChain === NonEvmChain.Near) {
          onUserInput(
            formatUnits(
              BigInt(balances[(selectedCurrency as any)?.assetId] || '0'),
              (selectedCurrency as any)?.decimals || 18,
            ),
          )
          return
        }

        if (selectedChain === NonEvmChain.Bitcoin) {
          onUserInput(formatUnits(BigInt(btcBalance || '0'), 8))
          return
        }
        if (selectedChain === NonEvmChain.Solana) {
          const b = solanaBalances[(selectedCurrency as any)?.id]
          if (b) onUserInput(formatUnits(BigInt(b.rawAmount), b.decimals))
          return
        }

        onUserInput(balance?.toExact() || '0')
      }}
    >
      <Wallet className="text-subText" />
      {!connectedAddress
        ? '--'
        : selectedChain === NonEvmChain.Solana
        ? formatDisplayNumber(solanaBalances[(selectedCurrency as any)?.id?.toString()]?.balance || 0, {
            significantDigits: 8,
          })
        : [NonEvmChain.Near, NonEvmChain.Bitcoin].includes(selectedChain)
        ? formatDisplayNumber(
            formatUnits(
              NonEvmChain.Near === selectedChain
                ? BigInt(balances[(selectedCurrency as any)?.assetId] || '0')
                : BigInt(btcBalance),
              (selectedCurrency as any)?.decimals,
            ),
            {
              significantDigits: 8,
            },
          )
        : balance?.toSignificant(6) || 0}
    </div>
  )

  return (
    <div className="rounded-2xl bg-buttonBlack p-3">
      {termAndPolicyModal}

      <div className="mb-3 flex justify-between">
        <SelectNetwork
          onSelectNetwork={onSelectNetwork}
          selectedChainId={selectedChain}
          chainIds={[NonEvmChain.Solana, NonEvmChain.Bitcoin, NonEvmChain.Near, ...MAINNET_NETWORKS]}
          ref={ref}
        />

        {evmLayout ? (
          balanceSection
        ) : (
          <div
            role="button"
            className="relative flex cursor-pointer items-center gap-1 text-xs font-medium text-subText"
            onClick={handleWalletClick}
          >
            {connectedAddress
              ? selectedChain === NonEvmChain.Near && connectedAddress.includes('.near')
                ? connectedAddress
                : shortenHash(connectedAddress)
              : t`Select Wallet`}
            <ChevronDown size={14} />

            {showMenu && (
              <div
                ref={node as React.RefObject<HTMLDivElement>}
                className="absolute right-0 top-[26px] rounded-lg bg-tableHeader"
              >
                <span
                  role="button"
                  className="block px-4 py-3"
                  onClick={async e => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (selectedChain === NonEvmChain.Near) nearSignOut()
                    else if (selectedChain === NonEvmChain.Bitcoin)
                      await availableWallets.find(wallet => wallet.type === walletInfo.walletType)?.disconnect?.()
                    else if (selectedChain === NonEvmChain.Solana) {
                      solanaDisconnect()
                    } else disconnectWallet()

                    toggleShowMenu()
                  }}
                >
                  {t`Disconnect`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <InputRow>
        {loading ? (
          <div style={{ flex: 1 }}>
            <Skeleton
              height="24px"
              width="160px"
              baseColor={theme.background}
              highlightColor={theme.buttonGray}
              borderRadius="1rem"
            />
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
          <Skeleton
            height="12px"
            width="44px"
            baseColor={theme.background}
            highlightColor={theme.buttonGray}
            borderRadius="1rem"
            style={{ marginRight: '6px' }}
          />
        ) : (
          !!amountUsd && (
            <span className="mr-2 text-sm font-medium text-border">
              ~{formatDisplayNumber(amountUsd, { significantDigits: 4, style: 'currency' })}
            </span>
          )
        )}

        <CurrencySelect
          selected={!!selectedCurrency}
          onClick={() => {
            if (!selectedChain) {
              ref?.current?.toggleNetworkModal()
              setAutoToggleTokenSelector(true)
              return
            }
            setModalOpen(true)
          }}
          style={{ cursor: 'pointer' }}
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
                        currentTarget.src = HelpIcon
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
        <Modal
          isOpen={modalOpen && selectedChain !== NonEvmChain.Bitcoin}
          onDismiss={() => setModalOpen(false)}
          maxHeight={isMobileHorizontal ? 100 : 80}
          height={isMobileHorizontal ? '95vh' : undefined}
        >
          <div className="flex w-full flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xl font-medium">{t`Select a token`}</span>
              <CloseIcon onClick={() => setModalOpen(false)} />
            </div>
            <SearchWrapper>
              <SearchInput
                type="text"
                id="token-search-input"
                data-testid="token-search-input"
                placeholder={t`Search by token name, token symbol or address`}
                value={searchQuery}
                ref={inputRef}
                onChange={e => {
                  setSearchQuery(e.target.value)
                }}
                autoComplete="off"
              />
              <SearchIcon size={18} className="text-border" />
            </SearchWrapper>

            <Separator />
            <div className="-mx-5 flex-1 overflow-y-scroll">
              {filteredTokens.map(item => {
                return (
                  <TokenRow
                    key={item.assetId}
                    role="button"
                    onClick={() => {
                      onSelectCurrency(item)
                      setModalOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={item.logo}
                        alt={item.symbol}
                        width={24}
                        height={24}
                        style={{ borderRadius: '50%' }}
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null
                          currentTarget.src = HelpIcon
                        }}
                      />
                      <div>
                        <span className="font-medium">{item.symbol}</span>
                        {selectedChain === NonEvmChain.Solana && (
                          <span className="mt-0.5 block text-[10px] text-subText">{shortenHash(item.assetId, 4)}</span>
                        )}
                      </div>
                    </div>
                    <span>
                      {selectedChain === 'solana'
                        ? formatDisplayNumber(solanaBalances[item.assetId]?.balance || 0, { significantDigits: 8 })
                        : formatDisplayNumber(formatUnits(BigInt(balances[item.assetId] || '0'), item.decimals), {
                            significantDigits: 8,
                          })}
                    </span>
                  </TokenRow>
                )
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
