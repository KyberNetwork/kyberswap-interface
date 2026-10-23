import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { useMedia } from 'react-use'
import { formatUnits } from 'viem'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import CurrencyInputPanel, { Aligner, CurrencySelect, StyledTokenName } from 'components/CurrencyInputPanel'
import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import { Currency, NonEvmChain, NonEvmChainInfo, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  chain: NonEvmChain
  currency?: Currency
  value: string
  amountUsd?: number
  output?: boolean
  loading?: boolean
  currencyLoading?: boolean
  onUserInput?: (value: string) => void
  onCurrencySelect: (currency: EvmCurrency) => void
  onSelectNonEvmCurrency: (chain: NonEvmChain, currency: NonEvmCurrency) => void
}

export const CrossChainCurrencyPanel = ({
  chain,
  currency,
  value,
  amountUsd,
  output,
  loading,
  currencyLoading,
  onUserInput,
  onCurrencySelect,
  onSelectNonEvmCurrency,
}: Props) => {
  const [open, setOpen] = useState(false)
  const { balances } = useNearBalances(chain === NonEvmChain.Near)
  const solanaBalances = useSolanaTokenBalances()
  const { balance: btcBalance, walletInfo } = useBitcoinWallet()
  const { publicKey } = useWallet()
  const { signedAccountId } = useWalletSelector()
  const connected =
    chain === NonEvmChain.Solana ? !!publicKey : chain === NonEvmChain.Near ? !!signedAccountId : !!walletInfo?.address
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const rawBalance =
    chain === NonEvmChain.Bitcoin
      ? btcBalance
      : currency && 'assetId' in currency
      ? balances[currency.assetId]
      : currency && 'id' in currency
      ? solanaBalances[currency.id]?.rawAmount
      : undefined
  const balance =
    connected && rawBalance !== undefined && currency ? formatUnits(BigInt(rawBalance), currency.decimals) : ''

  return (
    <>
      <div className="relative">
        {output && loading && (
          <div className="absolute bottom-[18px] left-3 z-10 flex">
            <Skeleton height={24} width={upToSmall ? 120 : 160} />
          </div>
        )}
        <CurrencyInputPanel
          id={output ? 'swap-currency-output' : 'swap-currency-input'}
          dataTestId={output ? 'swap-currency-output' : 'swap-currency-input'}
          value={output && loading ? ' ' : value}
          disabledInput={output}
          onUserInput={onUserInput}
          onMax={!output && balance !== '' ? () => onUserInput?.(balance) : undefined}
          balanceActionsEnabled={connected && !!currency}
          positionMax="top"
          positionLabel="in"
          label={output ? <Trans>Est. Output</Trans> : undefined}
          customBalanceText={balance || '--'}
          estimatedUsd={
            !loading && amountUsd
              ? formatDisplayNumber(amountUsd, { style: 'currency', significantDigits: 4 })
              : undefined
          }
          customCurrencySelect={
            <CurrencySelect
              type="button"
              selected={!!currency}
              className="open-currency-select-button"
              onClick={() => setOpen(true)}
            >
              <Aligner className="gap-1">
                <HStack className="items-center gap-2">
                  <div className="relative shrink-0">
                    <img
                      src={currency && 'logo' in currency ? currency.logo : UnknownToken}
                      alt={currency?.symbol}
                      className="size-5 rounded-full"
                    />
                    <img
                      src={NonEvmChainInfo[chain].icon}
                      alt={NonEvmChainInfo[chain].name}
                      title={NonEvmChainInfo[chain].name}
                      className="absolute -bottom-1 -right-1 size-3 rounded border border-background"
                    />
                  </div>
                  <StyledTokenName
                    active={!!currency}
                    className="token-symbol-container"
                    data-testid="token-symbol-container"
                  >
                    {currencyLoading && !currency ? (
                      <Skeleton width={64} height={16} />
                    ) : (
                      currency?.symbol || <Trans>Select a token</Trans>
                    )}
                  </StyledTokenName>
                </HStack>
                <DropdownSVG />
              </Aligner>
            </CurrencySelect>
          }
        />
      </div>
      <TokenSelectorModal
        isOpen={open}
        onDismiss={() => setOpen(false)}
        initialNonEvmChain={chain}
        selectedNonEvmCurrency={currency && !('chainId' in currency) ? currency : undefined}
        chainSelectionMode="form"
        onCurrencySelect={onCurrencySelect}
        onSelectNonEvmCurrency={onSelectNonEvmCurrency}
        showPinnedTokens
        trackingSource="swap"
      />
    </>
  )
}
