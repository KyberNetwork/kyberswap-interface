import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { ArrowDown, X } from 'react-feather'
import { Flex, Box, Text } from 'rebass'
import styled from 'styled-components'
import { useWalletClient } from 'wagmi'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { NETWORKS_INFO } from 'constants/networks'
import { formatDisplayNumber } from 'utils/numbers'
import CurrencyLogo from 'components/CurrencyLogo'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Summary } from './Summary'
import { useState } from 'react'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { Chain, NonEvmChain, NonEvmChainInfo } from '../adapters'
import { isEvmChain } from 'utils'

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
}: {
  chainId: Chain
  currency?: Currency
  amount: string
  usdValue: number
}) => {
  const theme = useTheme()
  const { name, icon } = isEvmChain(chainId)
    ? NETWORKS_INFO[chainId as ChainId]
    : NonEvmChainInfo[chainId as NonEvmChain]
  return (
    <TokenBox>
      <Flex justifyContent="space-between" fontSize={12} fontWeight={500} mb="0.5rem" color={theme.subText}>
        <Text>Input Amount</Text>
        <Flex sx={{ gap: '4px' }} alignItems="center">
          <img src={icon} alt={chainId.toString()} width={16} height={16} style={{ borderRadius: '50%' }} />
          <Text>{name}</Text>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" fontSize={20} fontWeight={500} mb="0.5rem">
        <Text fontSize={24}>{formatDisplayNumber(amount, { significantDigits: 8 })}</Text>
        <Flex alignItems="center" sx={{ gap: '4px' }} color={theme.subText}>
          <Text fontSize={14}>~{formatDisplayNumber(usdValue, { style: 'currency', significantDigits: 4 })}</Text>
          <CurrencyLogo currency={currency} size="24px" />
          <Text>{currency?.symbol}</Text>
        </Flex>
      </Flex>
    </TokenBox>
  )
}

export const ConfirmationPopup = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const theme = useTheme()
  const { selectedQuote, currencyIn, currencyOut, inputAmount, fromChainId, toChainId } = useCrossChainSwap()
  const { data: walletClient } = useWalletClient()
  const [submittingTx, setSubmittingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [txError, setTxError] = useState('')
  const [transactions, setTransactions] = useCrossChainTransactions()

  if (!selectedQuote || !currencyIn || !currencyOut || !inputAmount || !fromChainId || !toChainId) return null

  const handleSwap = async () => {
    if (!walletClient) return
    setSubmittingTx(true)
    const res = await selectedQuote.adapter.executeSwap(selectedQuote, walletClient).catch(e => {
      console.log(e)
      setTxError(e?.message)
      setSubmittingTx(false)
    })
    if (res) setTransactions([res, ...transactions])
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
              chainId={fromChainId}
              currency={currencyIn}
              amount={inputAmount?.toExact() || ''}
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
              chainId={toChainId}
              currency={currencyOut}
              amount={selectedQuote?.quote.formattedOutputAmount || ''}
              usdValue={selectedQuote?.quote.outputUsd || 0}
            />
            <Flex marginTop="1rem"></Flex>
            <Summary quote={selectedQuote} tokenOut={currencyOut} full />

            <Text marginY="1rem" fontStyle="italic" color={'#737373'} fontSize={12}>
              Routed via {selectedQuote.adapter.getName()}
            </Text>

            <ButtonPrimary onClick={handleSwap}>Confirm Swap</ButtonPrimary>
          </Wrapper>
        )
      }}
    />
  )
}
