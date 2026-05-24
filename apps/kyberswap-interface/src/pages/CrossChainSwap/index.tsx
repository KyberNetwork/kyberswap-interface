import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Repeat } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useSearchParams } from 'react-router-dom'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import RefreshLoading from 'components/RefreshLoading'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { PiWarning } from 'pages/CrossChainSwap/components/PiWarning'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { QuoteSelector } from 'pages/CrossChainSwap/components/QuoteSelector'
import { Summary } from 'pages/CrossChainSwap/components/Summary'
import { SwapAction } from 'pages/CrossChainSwap/components/SwapAction'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { TokenPanel } from 'pages/CrossChainSwap/components/TokenPanel'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { CrossChainSwapRegistryProvider, useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'
import { NearToken, SolanaToken } from 'state/crossChainSwap'
import { isEvmChain } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const Wrapper = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-4">{children}</div>

type CrossChainSwapProps = {
  onQuoteChange?: (quote: Quote) => void
}

export function CrossChainSwap({ onQuoteChange }: CrossChainSwapProps) {
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
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()
  const [showBtcModal, setShowBtcConnect] = useState(false)
  const [showEvmRecipient, setShowEvmRecipient] = useState(false)
  const [revertPrice, setRevertPrice] = useState(false)

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

  const isToNear = toChainId === NonEvmChain.Near
  const isToBtc = toChainId === NonEvmChain.Bitcoin
  const isToEvm = toChainId && isEvmChain(toChainId)
  const isToSolana = toChainId === NonEvmChain.Solana
  const networkName = isToNear ? 'NEAR' : isToBtc ? 'Bitcoin' : isToSolana ? 'Solana' : 'EVM'

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

  const isDifferentRecipient = isToNear
    ? nearWallet.signedAccountId && recipient !== nearWallet.signedAccountId
    : isToEvm
    ? account && recipient !== account
    : isToBtc
    ? btcAddress && btcAddress !== recipient
    : false

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
    <Wrapper>
      {termAndPolicyModal}

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

      <div className="flex items-center justify-between">
        <RefreshLoading
          refetchLoading={allLoading}
          clickable
          disableRefresh={disable || showPreview}
          onRefresh={getQuote}
        />

        <div className="ml-1 flex flex-1 flex-wrap items-center gap-1 text-sm text-text">
          <span className="text-subText">
            <Trans>Cross-chain rate:</Trans>
          </span>
          {loading ? (
            <Skeleton
              height="16px"
              width="120px"
              baseColor={theme.disableText}
              highlightColor={theme.buttonGray}
              borderRadius="1rem"
            />
          ) : selectedQuote && toChainId ? (
            <div
              role="button"
              className="flex cursor-pointer flex-wrap items-center gap-1"
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
              <Repeat size={12} className="text-subText" />
            </div>
          ) : (
            '--'
          )}
        </div>

        <ReverseTokenSelectionButton
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

      <AutoColumn gap="8px">
        <div className="flex items-center justify-between px-2 text-xs text-subText">
          <div
            className="flex cursor-pointer items-center gap-1"
            role="button"
            onClick={() => {
              if (isEvmChain(fromChainId) && isToEvm) {
                if (!showEvmRecipient) {
                  setRecipient('')
                }
                setShowEvmRecipient(prev => !prev)
              }
            }}
          >
            <span>
              {isEvmChain(fromChainId) && isToEvm ? (
                <Trans>Send to other wallet</Trans>
              ) : (
                t`Recipient (${networkName} address)`
              )}
            </span>
            {isEvmChain(fromChainId) &&
              isToEvm &&
              (showEvmRecipient ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
          </div>

          {toChainId && (isEvmChain(fromChainId) && isToEvm ? showEvmRecipient : true) && (
            <div className="flex gap-1">
              {isDifferentRecipient && (!isEvmChain(fromChainId) || !isToEvm) && (
                <ButtonLight
                  padding="2px 8px"
                  width="fit-content"
                  style={{ fontSize: '12px' }}
                  onClick={() => {
                    let reci = ''
                    if (isToEvm) reci = account || ''
                    if (isToNear) reci = nearWallet.signedAccountId || ''
                    if (isToBtc) reci = btcAddress || ''
                    setRecipient(reci)
                  }}
                >
                  <Trans>Use my wallet</Trans>
                </ButtonLight>
              )}
            </div>
          )}
        </div>
        {(isEvmChain(fromChainId) && isToEvm ? showEvmRecipient : true) && (
          <AddressInput
            placeholder={t`Enter ${networkName} receiving address`}
            value={recipient}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const input = event.target.value
              const withoutSpaces = input.replace(/\s+/g, '')
              setRecipient(withoutSpaces)
            }}
          />
        )}
      </AutoColumn>

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

      <Summary quote={selectedQuote || undefined} tokenOut={currencyOut} />

      {selectedQuote && (
        <div className="flex items-center text-xs italic text-gray">
          <span className="mr-1">
            <Trans>Routed via</Trans>
          </span>
          <QuoteProviderName quote={selectedQuote} />
        </div>
      )}

      <PiWarning />
      <SwapAction setShowBtcModal={setShowBtcConnect} />

      <BitcoinConnectModal
        isOpen={showBtcModal}
        onDismiss={() => {
          setShowBtcConnect(false)
        }}
      />
    </Wrapper>
  )
}

export default function CrossChainSwapPage(props: CrossChainSwapProps) {
  return (
    <CrossChainSwapRegistryProvider>
      <CrossChainSwap {...props} />
    </CrossChainSwapRegistryProvider>
  )
}
