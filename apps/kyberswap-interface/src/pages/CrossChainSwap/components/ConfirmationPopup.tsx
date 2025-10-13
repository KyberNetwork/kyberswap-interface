import { ChainId, CurrencyAmount, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { adaptSolanaWallet } from '@reservoir0x/relay-solana-wallet-adapter'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { ArrowDown, X } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { useLazyCheckBlackjackQuery } from 'services/blackjack'
import styled from 'styled-components'
import { formatUnits } from 'viem'
import { useWalletClient } from 'wagmi'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { NETWORKS_INFO } from 'constants/networks'
import { CROSS_CHAIN_MIXPANEL_TYPE, useCrossChainMixpanel } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { ExternalLink } from 'theme'
import { getEtherscanLink, isEvmChain, shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { Chain, Currency, NonEvmChain, NonEvmChainInfo } from '../adapters'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { getChainName } from '../utils'
import { PiWarning } from './PiWarning'
import { Tag } from './QuoteSelector'
import { Summary } from './Summary'

const Wrapper = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  width: 100%;
`

const TokenBox = styled.div`
  border-radius: 1rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.border};
`

const TokenBoxInfo = ({
  chainId,
  currency,
  usdValue,
  amount,
  title,
}: {
  chainId: Chain
  currency?: Currency
  amount: string
  usdValue: number
  title: string
}) => {
  const theme = useTheme()
  const { name, icon } = isEvmChain(chainId)
    ? NETWORKS_INFO[chainId as ChainId]
    : NonEvmChainInfo[chainId as NonEvmChain]
  return (
    <TokenBox>
      <Flex justifyContent="space-between" fontSize={12} fontWeight={500} mb="0.5rem" color={theme.subText}>
        <Text>{title}</Text>
        <Flex sx={{ gap: '4px' }} alignItems="center">
          <img src={icon} alt={chainId.toString()} width={16} height={16} style={{ borderRadius: '50%' }} />
          <Text>{name}</Text>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" fontSize={20} fontWeight={500} mb="0.5rem">
        <Text fontSize={24}>{formatDisplayNumber(amount, { significantDigits: 8 })}</Text>
        <Flex alignItems="center" sx={{ gap: '4px' }} color={theme.subText}>
          <Text fontSize={14}>~{formatDisplayNumber(usdValue, { style: 'currency', significantDigits: 4 })}</Text>
          {isEvmChain(chainId) ? (
            <CurrencyLogo currency={currency as EvmCurrency} size="24px" />
          ) : (
            <img src={(currency as any).logo} width={24} height={24} alt="" />
          )}
          <Text>{currency?.symbol}</Text>
        </Flex>
      </Flex>
    </TokenBox>
  )
}

export const ConfirmationPopup = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const theme = useTheme()
  const {
    selectedQuote,
    currencyIn,
    currencyOut,
    amountInWei,
    fromChainId,
    toChainId,
    warning,
    recipient,
    sender,
    receiver,
  } = useCrossChainSwap()
  const { data: walletClient } = useWalletClient()
  const [submittingTx, setSubmittingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [txError, setTxError] = useState('')
  const [transactions, setTransactions] = useCrossChainTransactions()
  const [searchParams, setSearchParams] = useSearchParams()
  const transactionHashes = searchParams.get('transactionHashes')
  useEffect(() => {
    try {
      const tx = JSON.parse(localStorage.getItem('cross-chain-swap-my-near-wallet-tx') || '')
      if (transactionHashes && tx) {
        setTransactions([tx, ...transactions].slice(0, 30))
        localStorage.removeItem('cross-chain-swap-my-near-wallet-tx')
        searchParams.delete('transactionHashes')
        setSearchParams(searchParams)
      }
    } catch {
      // do nothing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionHashes])

  const nearWallet = useWalletSelector()

  const { walletInfo, availableWallets } = useBitcoinWallet()

  const [checkBlackjack] = useLazyCheckBlackjackQuery()

  const { publicKey: solanaAddress, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const sendBtcFn = async (params: { recipient: string; amount: string | number }) => {
    const feeRate = await fetch('https://mempool.space/api/v1/fees/recommended').then(res => res.json())

    const selectedWallet = availableWallets.find(item => item.type === walletInfo.walletType)
    if (!selectedWallet) throw new Error('Not connected wallet')
    return selectedWallet.sendBitcoin({
      ...params,
      sender: walletInfo?.address || undefined,
      ...(feeRate?.fastestFee
        ? {
            options: { feeRate: feeRate.fastestFee * 1.2 },
          }
        : {}),
    })
  }

  const inputAmount =
    isEvmChain(fromChainId) && currencyIn
      ? CurrencyAmount.fromRawAmount(currencyIn as EvmCurrency, amountInWei || '0')
      : undefined

  if (
    !selectedQuote ||
    !currencyIn ||
    !currencyOut ||
    !fromChainId ||
    !toChainId ||
    !amountInWei ||
    amountInWei === '0'
  )
    return null

  if (isEvmChain(fromChainId) && !inputAmount) return null

  const amount = inputAmount?.toExact() || formatUnits(BigInt(amountInWei), currencyIn.decimals)

  const handleSwap = async () => {
    if (isEvmChain(fromChainId) && !walletClient) return
    const adaptedWallet = adaptSolanaWallet(
      solanaAddress?.toString() || '1nc1nerator11111111111111111111111111111111',
      792703809, //chain id that Relay uses to identify solana
      connection,
      async (transaction, options) => {
        try {
          // Ensure transaction is properly formatted
          if (transaction instanceof VersionedTransaction || transaction instanceof Transaction) {
            const signature = await sendTransaction(transaction, connection, options)
            return { signature }
          } else {
            throw new Error('Invalid transaction type')
          }
        } catch (error) {
          console.error('Transaction sending failed:', error)
          throw error
        }
      },
    )

    setSubmittingTx(true)

    const blackjackRes = await checkBlackjack(sender)
    if (blackjackRes?.data?.blacklisted) {
      setSubmittingTx(false)
      setTxError('There was an error with your transaction.')
      return
    }

    const res = await selectedQuote.adapter
      .executeSwap(
        selectedQuote,
        fromChainId === 'solana' ? adaptedWallet : (walletClient as any),
        nearWallet,
        sendBtcFn,
        sendTransaction,
        connection,
      )
      .catch(e => {
        console.log(e)
        setTxError(e?.message)
        setSubmittingTx(false)
      })

    if (
      res?.sourceTxHash === 'GasRefuel cancelled' ||
      res?.sourceTxHash === 'Rejected' ||
      res?.sourceTxHash?.includes('Not enough ETH for gas')
    ) {
      setTxError(res?.sourceTxHash || '')
      setSubmittingTx(false)
      return
    }

    if (res) {
      // enrich tx with usd/fee/recipient for later use
      const enriched = {
        ...res,
        amountInUsd: selectedQuote.quote.inputUsd,
        amountOutUsd: selectedQuote.quote.outputUsd,
        platformFeePercent: selectedQuote.quote.platformFeePercent,
        recipient: receiver,
      }

      setTransactions([enriched, ...transactions].slice(0, 30))

      const swapDetails = {
        amount_in: amount,
        amount_in_usd: selectedQuote.quote.inputUsd,
        amount_out: selectedQuote.quote.outputAmount.toString(),
        amount_out_usd: selectedQuote.quote.outputUsd,
        currency: 'USD',
        fee_percent: selectedQuote.quote.platformFeePercent,
        from_chain: fromChainId,
        from_chain_name: getChainName(fromChainId),
        from_token:
          fromChainId === NonEvmChain.Bitcoin
            ? currencyIn.symbol
            : fromChainId === NonEvmChain.Solana
            ? (currencyIn as any).id
            : fromChainId === NonEvmChain.Near
            ? (currencyIn as any).assetId
            : (currencyIn as any)?.address || currencyIn?.symbol,
        from_token_symbol: currencyIn?.symbol,
        from_token_decimals: currencyIn?.decimals,
        to_chain: toChainId,
        to_chain_name: getChainName(toChainId),
        to_token:
          toChainId === NonEvmChain.Bitcoin
            ? currencyOut.symbol
            : toChainId === NonEvmChain.Solana
            ? (currencyOut as any).id
            : toChainId === NonEvmChain.Near
            ? (currencyOut as any).assetId
            : (currencyOut as any)?.address || currencyOut?.symbol,
        to_token_symbol: currencyOut?.symbol,
        to_token_decimals: currencyOut?.decimals,
        partner: selectedQuote.adapter.getName(),
        platform: 'KyberSwap Cross-Chain',
        source_tx_hash: res.sourceTxHash,
        target_tx_hash: undefined,
        recipient: receiver,
        sender,
        status: 'init',
        time: Date.now(),
        timestamp: Date.now(),
      }
      crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_INIT, swapDetails)
    }
    setTxHash(res?.sourceTxHash || '')
    setSubmittingTx(false)
  }

  const dismiss = () => {
    setSubmittingTx(false)
    onDismiss()
    setTxHash('')
    setSubmittingTx(false)
    setTxError('')
  }

  return (
    <TransactionConfirmationModal
      isOpen={submittingTx || isOpen}
      onDismiss={dismiss}
      hash={txHash}
      scanLink={
        fromChainId === NonEvmChain.Solana
          ? `https://solscan.io/tx/${txHash}`
          : fromChainId === NonEvmChain.Near
          ? `https://nearblocks.io/address/${txHash}`
          : fromChainId === NonEvmChain.Bitcoin
          ? `https://mempool.space/tx/${txHash}`
          : getEtherscanLink(fromChainId, txHash, 'transaction')
      }
      attemptingTxn={submittingTx}
      pendingText={`Swapping ${currencyIn?.symbol} for ${currencyOut?.symbol}`}
      content={() => {
        if (txError) {
          return <TransactionErrorContent message={txError} onDismiss={dismiss} />
        }
        return (
          <Wrapper>
            <Flex justifyContent="space-between" alignItems="center" mb="0.75rem">
              <Text fontSize={20} fontWeight="500">
                Confirm Swap Details
              </Text>
              <ButtonEmpty width="fit-content" padding="0" onClick={onDismiss}>
                <X size={20} color={theme.text} />
              </ButtonEmpty>
            </Flex>
            <Text color={theme.subText} fontSize={12} marginBottom="1rem">
              Please review the details of your swap
            </Text>
            <TokenBoxInfo
              title="Input Amount"
              chainId={fromChainId}
              currency={currencyIn}
              amount={amount || ''}
              usdValue={selectedQuote?.quote.inputUsd || 0}
            />
            <Box
              sx={{
                color: theme.subText,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `1px solid ${theme.border}`,
                marginTop: '-4px',
                marginBottom: '-4px',
                backgroundColor: theme.tabActive,
                zIndex: 1,
                marginX: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <ArrowDown />
            </Box>
            <TokenBoxInfo
              title="Ouput Amount"
              chainId={toChainId}
              currency={currencyOut}
              amount={selectedQuote?.quote.formattedOutputAmount || ''}
              usdValue={selectedQuote?.quote.outputUsd || 0}
            />
            <Box
              sx={{
                marginTop: '1rem',
                padding: '12px',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                Recipient
              </Text>
              <Flex fontSize={14} alignItems="center" color={theme.subText}>
                <ExternalLink
                  style={{ textDecoration: 'none', color: theme.text }}
                  href={
                    toChainId === NonEvmChain.Solana
                      ? `https://solscan.io/account/${recipient}`
                      : toChainId === NonEvmChain.Near
                      ? `https://nearblocks.io/address/${recipient}`
                      : toChainId === NonEvmChain.Bitcoin
                      ? `https://mempool.space/address/${recipient}`
                      : getEtherscanLink(toChainId, recipient, 'address')
                  }
                >
                  {recipient.includes('.near') ? recipient : shortenHash(recipient)} ↗
                </ExternalLink>
                <CopyHelper toCopy={recipient} />
              </Flex>
            </Box>
            <Flex marginTop="1rem"></Flex>
            <Summary quote={selectedQuote} tokenOut={currencyOut} full />

            {warning?.priceImpaceInfo?.message && <Flex marginTop="1rem"></Flex>}
            <PiWarning />

            <Text marginY="1rem" fontStyle="italic" color={'#737373'} fontSize={12} display="flex" alignItems="center">
              Routed via {selectedQuote.adapter.getName()}
              {selectedQuote.adapter.getName() === 'Optimex' && <Tag>Beta</Tag>}
            </Text>

            <ButtonPrimary onClick={handleSwap}>Confirm Swap</ButtonPrimary>
          </Wrapper>
        )
      }}
    />
  )
}
