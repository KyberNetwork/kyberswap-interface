import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { ChangeEvent, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Repeat } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import RefreshLoading from 'components/RefreshLoading'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { PiWarning } from 'pages/CrossChainSwap/components/PiWarning'
import { QuoteSelector, Tag } from 'pages/CrossChainSwap/components/QuoteSelector'
import { Summary } from 'pages/CrossChainSwap/components/Summary'
import { SwapAction } from 'pages/CrossChainSwap/components/SwapAction'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { TokenPanel } from 'pages/CrossChainSwap/components/TokenPanel'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { CrossChainSwapRegistryProvider, useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { NearToken, SolanaToken } from 'state/crossChainSwap'
import { isEvmChain } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

function CrossChainSwap() {
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()
  const [showBtcModal, setShowBtcConnect] = useState(false)
  const [showEvmRecipient, setShowEvmRecipient] = useState(false)
  const [revertPrice, setRevertPrice] = useState(false)

  const showConnect = searchParams.get('showConnect')

  const isToNear = toChainId === NonEvmChain.Near
  const isToBtc = toChainId === NonEvmChain.Bitcoin
  const isToEvm = toChainId && isEvmChain(toChainId)
  const isToSolana = toChainId === NonEvmChain.Solana
  const networkName = isToNear ? 'NEAR' : isToBtc ? 'Bitcoin' : isToSolana ? 'Solana' : 'EVM'

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
        onSelectNetwork={chainId => {
          searchParams.set('from', chainId.toString())
          setSearchParams(searchParams)
        }}
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

      <Flex justifyContent="space-between" alignItems="center">
        <RefreshLoading
          refetchLoading={allLoading}
          clickable
          disableRefresh={disable || showPreview}
          onRefresh={getQuote}
        />

        <Flex
          color={theme.text}
          flexWrap="wrap"
          fontSize="14px"
          alignItems="center"
          sx={{ gap: '4px', flex: 1 }}
          ml="4px"
        >
          <Text as="span" color={theme.subText}>
            Cross-chain rate:
          </Text>
          {loading ? (
            <Skeleton
              height="16px"
              width="120px"
              baseColor={theme.disableText}
              highlightColor={theme.buttonGray}
              borderRadius="1rem"
            />
          ) : selectedQuote && toChainId ? (
            <Flex
              role="button"
              flexWrap="wrap"
              sx={{ alignItems: 'center', gap: '4px', cursor: 'pointer' }}
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
              <Repeat size={12} color={theme.subText} />
            </Flex>
          ) : (
            '--'
          )}
        </Flex>

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
      </Flex>

      <TokenPanel
        loading={loading}
        evmLayout={isEvmChain(fromChainId) && isToEvm}
        setShowBtcConnect={setShowBtcConnect}
        selectedChain={toChainId}
        selectedCurrency={currencyOut || undefined}
        onSelectNetwork={chainId => {
          searchParams.set('to', chainId.toString())
          setSearchParams(searchParams)
        }}
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
        <Flex justifyContent="space-between" fontSize={12} color={theme.subText} px="8px" alignItems="center">
          <Flex
            alignItems="center"
            sx={{ gap: '4px', cursor: 'pointer' }}
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
            <Text>
              {isEvmChain(fromChainId) && isToEvm ? 'Send to other wallet' : `Recipient (${networkName} address)`}
            </Text>
            {isEvmChain(fromChainId) &&
              isToEvm &&
              (showEvmRecipient ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
          </Flex>

          {toChainId && (isEvmChain(fromChainId) && isToEvm ? showEvmRecipient : true) && (
            <Flex sx={{ gap: '4px' }}>
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
                  Use my wallet
                </ButtonLight>
              )}
            </Flex>
          )}
        </Flex>
        {(isEvmChain(fromChainId) && isToEvm ? showEvmRecipient : true) && (
          <AddressInput
            placeholder={`Enter ${networkName} receiving address`}
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
              }}
              tokenOut={currencyOut}
            />
          ) : null
        }
      />

      <Summary quote={selectedQuote || undefined} tokenOut={currencyOut} />

      {selectedQuote && (
        <Text fontStyle="italic" color={'#737373'} fontSize={12} display="flex">
          Routed via {selectedQuote.adapter.getName()}
          {selectedQuote.adapter.getName() === 'Optimex' && <Tag>Beta</Tag>}
        </Text>
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

export default function CrossChainSwapPage() {
  return (
    <CrossChainSwapRegistryProvider>
      <CrossChainSwap />
    </CrossChainSwapRegistryProvider>
  )
}
