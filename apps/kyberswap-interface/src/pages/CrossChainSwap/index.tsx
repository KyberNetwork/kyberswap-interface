import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { useSearchParams } from 'react-router-dom'

import { AutoColumn } from 'components/Column'
import RefreshLoading from 'components/RefreshLoading'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { PiWarning } from 'pages/CrossChainSwap/components/PiWarning'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { QuoteSelector } from 'pages/CrossChainSwap/components/QuoteSelector'
import { RecipientPanel } from 'pages/CrossChainSwap/components/RecipientPanel'
import { Summary } from 'pages/CrossChainSwap/components/Summary'
import { SwapAction } from 'pages/CrossChainSwap/components/SwapAction'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { TokenPanel } from 'pages/CrossChainSwap/components/TokenPanel'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { CrossChainSwapRegistryProvider, useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import type { NearToken } from 'pages/CrossChainSwap/hooks/useNearTokens'
import type { SolanaToken } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import { Quote } from 'pages/CrossChainSwap/registry'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type CrossChainSwapProps = {
  onQuoteChange?: (quote: Quote) => void
}

const CrossChainSwapForm = ({ onQuoteChange }: CrossChainSwapProps) => {
  const {
    amount,
    setAmount,
    selectedQuote,
    setSelectedAdapter,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    quotes,
    allLoading,
    loading,
    getQuote,
    disable,
    showPreview,
    recipient,
    setRecipient,
    warning,
  } = useCrossChainSwap()
  const { trackingHandler } = useTracking()
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()
  const [showBtcModal, setShowBtcConnect] = useState(false)
  const [showEvmRecipient, setShowEvmRecipient] = useState(false)
  const [revertPrice, setRevertPrice] = useState(false)
  const getQuoteRef = useRef(getQuote)

  useEffect(() => {
    getQuoteRef.current = getQuote
  }, [getQuote])

  const handleRefresh = useCallback(() => {
    getQuoteRef.current()
  }, [])

  useEffect(() => {
    if (showPreview) return
    if (disable) {
      getQuote()
      return
    }

    const timeout = setTimeout(() => {
      getQuote()
    }, 300)

    return () => clearTimeout(timeout)
  }, [disable, getQuote, showPreview])

  // Debounce recipient for tracking
  const debouncedRecipient = useDebounce(recipient, 1000)
  const prevRecipientRef = useRef(recipient)
  useEffect(() => {
    if (debouncedRecipient && debouncedRecipient !== prevRecipientRef.current && debouncedRecipient.length > 5) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_RECIPIENT_ADDRESS_ENTERED, {
        recipient_address: debouncedRecipient,
        to_chain: toChainId,
      })
      prevRecipientRef.current = debouncedRecipient
    }
  }, [debouncedRecipient, toChainId, trackingHandler])

  const handleSourceChainSelect = useCallback(
    (chainId: number | string) => {
      trackingHandler(TRACKING_EVENT_TYPE.CC_SOURCE_CHAIN_SELECTED, {
        previous_chain: fromChainId,
        new_chain: chainId,
      })
      searchParams.set('from', chainId.toString())
      searchParams.delete('tokenIn')
      setSearchParams(searchParams)
    },
    [trackingHandler, fromChainId, searchParams, setSearchParams],
  )

  const handleDestinationChainSelect = useCallback(
    (chainId: number | string) => {
      trackingHandler(TRACKING_EVENT_TYPE.CC_DESTINATION_CHAIN_SELECTED, {
        previous_chain: toChainId,
        new_chain: chainId,
      })
      searchParams.set('to', chainId.toString())
      searchParams.delete('tokenOut')
      setSearchParams(searchParams)
    },
    [trackingHandler, toChainId, searchParams, setSearchParams],
  )

  const showConnect = searchParams.get('showConnect')

  const isToEvm = toChainId && isEvmChain(toChainId)

  useEffect(() => {
    if (selectedQuote) {
      onQuoteChange?.(selectedQuote)
    }
  }, [onQuoteChange, selectedQuote])

  useEffect(() => {
    if (isEvmChain(fromChainId) && isToEvm && !showEvmRecipient) {
      setRecipient(account || '')
    }
  }, [showEvmRecipient, account, fromChainId, isToEvm, setRecipient])

  const nearWallet = useWalletSelector()
  const { walletInfo } = useBitcoinWallet()
  const btcAddress = walletInfo?.address

  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()

  useEffect(() => {
    if (showConnect) {
      if (fromChainId === NonEvmChain.Bitcoin && !btcAddress) {
        setShowBtcConnect(true)
      } else if (fromChainId === NonEvmChain.Near && !nearWallet.signedAccountId) {
        onOpenWallet('near')
      }
      searchParams.delete('showConnect')
      setSearchParams(searchParams)
    }
  }, [showConnect, searchParams, setSearchParams, fromChainId, btcAddress, nearWallet, onOpenWallet])

  return (
    <Stack className="gap-4">
      {termAndPolicyModal}

      <AutoColumn className="gap-3">
        <TokenPanel
          evmLayout={isEvmChain(fromChainId) && isToEvm}
          setShowBtcConnect={setShowBtcConnect}
          selectedChain={fromChainId}
          selectedCurrency={currencyIn || undefined}
          onSelectNetwork={handleSourceChainSelect}
          value={amount}
          amountUsd={selectedQuote?.quote.inputUsd}
          onUserInput={value => {
            setAmount(value)
          }}
          disabled={false}
          onSelectCurrency={currency => {
            const c = currency as EvmCurrency

            searchParams.set(
              'tokenIn',
              isEvmChain(fromChainId)
                ? (c.isNative ? c.symbol : c.address) || c.wrapped.address
                : (currency as NearToken).assetId,
            )
            setSearchParams(searchParams)
          }}
        />

        <div className="flex items-center justify-between gap-1">
          <RefreshLoading
            refetchLoading={allLoading}
            clickable
            disableRefresh={disable || showPreview}
            refreshOnMount={false}
            onRefresh={handleRefresh}
          />

          <div className="flex flex-1 flex-wrap items-center gap-2 text-sm font-medium text-text">
            <span className="text-subText">
              <Trans>Cross-chain rate:</Trans>
            </span>
            {loading ? (
              <Skeleton height={20} width={120} />
            ) : selectedQuote && toChainId ? (
              <div
                role="button"
                className="flex cursor-pointer flex-wrap items-center gap-1 hover:brightness-[0.85]"
                onClick={() => setRevertPrice(!revertPrice)}
              >
                1{' '}
                <TokenLogoWithChain
                  currency={revertPrice ? currencyOut : currencyIn}
                  chainId={revertPrice ? toChainId : fromChainId}
                />
                {}={' '}
                {formatDisplayNumber(revertPrice ? 1 / selectedQuote.quote.rate : selectedQuote.quote.rate, {
                  significantDigits: 6,
                })}
                <TokenLogoWithChain
                  currency={revertPrice ? currencyIn : currencyOut}
                  chainId={revertPrice ? fromChainId : toChainId}
                />
                <Repeat size={14} className="text-subText" />
              </div>
            ) : (
              <Skeleton height={20} width={120} />
            )}
          </div>

          <ReverseTokenSelectionButton
            className="size-6 bg-buttonGray p-0.5"
            onClick={() => {
              const cIn = currencyIn as EvmCurrency
              const cOut = currencyOut as EvmCurrency
              const isFromEvm = isEvmChain(fromChainId)
              const isToEvm = toChainId && isEvmChain(toChainId)
              searchParams.set('from', toChainId?.toString() || '')
              searchParams.set('to', fromChainId?.toString() || '')
              searchParams.set(
                'tokenIn',
                isToEvm
                  ? cOut?.isNative
                    ? cOut.symbol || ''
                    : cOut?.wrapped.address || ''
                  : (currencyOut as NearToken)?.assetId || (currencyOut as SolanaToken)?.id || '',
              )
              searchParams.set(
                'tokenOut',
                isFromEvm
                  ? cIn?.isNative
                    ? cIn.symbol || ''
                    : cIn?.wrapped.address || ''
                  : (currencyIn as NearToken)?.assetId || (currencyIn as SolanaToken)?.id || '',
              )
              setSearchParams(searchParams)
            }}
          />
        </div>

        <TokenPanel
          loading={loading}
          evmLayout={isEvmChain(fromChainId) && isToEvm}
          setShowBtcConnect={setShowBtcConnect}
          selectedChain={toChainId}
          selectedCurrency={currencyOut || undefined}
          onSelectNetwork={handleDestinationChainSelect}
          value={selectedQuote?.quote.formattedOutputAmount || ''}
          amountUsd={selectedQuote?.quote.outputUsd}
          onUserInput={() => {
            //
          }}
          disabled
          onSelectCurrency={currency => {
            const c = currency as EvmCurrency
            searchParams.set(
              'tokenOut',
              toChainId && isEvmChain(toChainId)
                ? (c.isNative ? c.symbol : c.address) || c.wrapped.address
                : (currency as NearToken).assetId,
            )
            setSearchParams(searchParams)
          }}
        />
      </AutoColumn>

      <AutoColumn className="gap-3">
        <RecipientPanel
          account={account}
          btcAddress={btcAddress}
          fromChainId={fromChainId}
          nearAccountId={nearWallet.signedAccountId}
          recipient={recipient}
          setRecipient={setRecipient}
          setShowEvmRecipient={setShowEvmRecipient}
          showEvmRecipient={showEvmRecipient}
          toChainId={toChainId}
        />

        <div className={cn('flex items-center', selectedQuote ? '' : 'min-h-7')}>
          <SlippageSetting
            slippageInfo={warning?.slippageInfo}
            rightComponent={
              selectedQuote ? (
                <QuoteSelector
                  quotes={quotes}
                  selectedQuote={selectedQuote}
                  onChange={newSelectedQuote => {
                    setSelectedAdapter(newSelectedQuote.adapter.getName())
                    onQuoteChange?.(newSelectedQuote)
                  }}
                  tokenOut={currencyOut}
                />
              ) : null
            }
          />
        </div>

        <Summary quote={selectedQuote || undefined} tokenOut={currencyOut} />
      </AutoColumn>

      {selectedQuote ? (
        <div className="flex items-center text-xs italic text-gray">
          <span className="mr-1">
            <Trans>Routed via</Trans>
          </span>
          <QuoteProviderName quote={selectedQuote} />
        </div>
      ) : (
        <Skeleton height={16} width={140} />
      )}

      <PiWarning />

      <SwapAction setShowBtcModal={setShowBtcConnect} />

      <BitcoinConnectModal
        isOpen={showBtcModal}
        onDismiss={() => {
          setShowBtcConnect(false)
        }}
      />
    </Stack>
  )
}

// memo is load-bearing: this wrapper hosts the route-mounted non-EVM wallet providers (NonEvmProviders).
// The parent CrossChain route re-renders this on every quote tick (it holds selectedQuote in state), and its only prop
// `onQuoteChange` is a stable setState setter — so memoizing here keeps the parent re-renders from
// re-rendering the providers, which would otherwise churn the wallet contexts (e.g. Solana `connection`)
// and refetch the cross-chain rate in a loop. The inner CrossChainSwapForm still re-renders on its own state.
const CrossChainSwap = (props: CrossChainSwapProps) => {
  return (
    <NonEvmProviders>
      <CrossChainSwapRegistryProvider>
        <CrossChainSwapForm {...props} />
      </CrossChainSwapRegistryProvider>
    </NonEvmProviders>
  )
}

export default memo(CrossChainSwap)
