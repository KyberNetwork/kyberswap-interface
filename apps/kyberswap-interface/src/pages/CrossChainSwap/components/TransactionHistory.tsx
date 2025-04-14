import { useEffect, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Flex, Text } from 'rebass'
import { useCrossChainTransactions } from 'state/crossChainTransactions'
import styled from 'styled-components'
import { registry } from '../hooks/useCrossChainSwap'
import { format } from 'date-fns'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import { NETWORKS_INFO } from 'constants/networks'
import { ChevronRight } from 'react-feather'
import { TokenLogoWithChain } from './TokenLogoWithChain'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'viem'
import { getEtherscanLink, shortenHash } from 'utils'
import { ExternalLinkIcon } from 'theme'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  background: ${({ theme }) => theme.background};
  margin-top: 74px;
  gap: 0.75rem;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
  padding: 0.75rem 1rem;
`

const TableRow = styled(TableHeader)`
  margin-top: 0;
  background: transparent;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;
  align-items: center;
  color: ${({ theme }) => theme.text};
`

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useCrossChainTransactions()

  const pendingTxs = useMemo(() => {
    return transactions.filter(tx => !tx.targetTxHash || tx.status !== 'filled')
  }, [transactions])

  useEffect(() => {
    // Create an array to track if we need to update
    const updatedTransactions = [...transactions]
    let hasUpdates = false

    // Create an async function to fetch statuses
    const checkTransactions = async () => {
      // Use Promise.all to handle multiple async calls efficiently
      await Promise.all(
        pendingTxs.map(async tx => {
          const adapter = registry.getAdapter(tx.adapter)
          if (!adapter) return null

          try {
            const { txHash, status } = (await adapter.getTransactionStatus(tx)) || {
              txHash: '',
              status: 'pending',
            }

            // Only update if we have a txHash or status changed
            if (txHash || status !== tx.status) {
              // Find the transaction index in our copied array
              const txIndex = updatedTransactions.findIndex(t => t.id === tx.id)

              if (txIndex !== -1) {
                // Create updated transaction with new data
                updatedTransactions[txIndex] = {
                  ...updatedTransactions[txIndex],
                  targetTxHash: txHash || updatedTransactions[txIndex].targetTxHash,
                  status: status || updatedTransactions[txIndex].status,
                }
                hasUpdates = true
              }
            }
            return true
          } catch (error) {
            console.error(`Failed to check status for transaction ${tx.id}:`, error)
            return false
          }
        }),
      )

      // Only dispatch update if we have changes
      if (hasUpdates) {
        setTransactions(updatedTransactions)
      }
    }

    // Only run if we have pending transactions
    if (pendingTxs.length > 0) {
      checkTransactions()

      // Optional: set up an interval to poll for updates
      const interval = setInterval(checkTransactions, 10_000) // Check every 10 seconds

      return () => clearInterval(interval)
    }
    return undefined
  }, [pendingTxs, transactions, setTransactions])

  const theme = useTheme()

  return (
    <>
      <TableHeader>
        <Text>CREATED</Text>
        <Text>STATUS</Text>
        <Text>ROUTE</Text>
        <Text>AMOUNT</Text>
        <Text textAlign="right">ACTIONS</Text>
      </TableHeader>
      {transactions.map(tx => (
        <TableRow key={tx.id}>
          <Flex sx={{ gap: '4px' }} alignItems="center">
            <img
              src={registry.getAdapter(tx.adapter)?.getIcon()}
              style={{ borderRadius: '50%' }}
              width={16}
              height={16}
              alt=""
            />
            <Text>{format(new Date(tx.timestamp), 'dd/MM/yyyy')}</Text>
            <Text color={theme.subText}>{format(new Date(tx.timestamp), 'HH:mm:ss')}</Text>
          </Flex>

          <Flex
            sx={{
              borderRadius: '999px',
              padding: '2px 8px',
              width: 'fit-content',
              height: 'fit-content',
              background: rgba(tx.status === 'filled' ? theme.primary : theme.warning, 0.2),
              color: tx.status === 'filled' ? theme.primary : theme.warning,
              fontSize: '12px',
            }}
          >
            {tx.status === 'filled' ? 'Success' : 'Processing'}
          </Flex>

          <Flex alignItems="center" color={theme.subText} sx={{ gap: '4px' }}>
            <img src={(NETWORKS_INFO as any)[tx.sourceChain]?.icon} alt="" width={16} height={16} />
            <ChevronRight size={14} />
            <img src={(NETWORKS_INFO as any)[tx.targetChain]?.icon} alt="" width={16} height={16} />
          </Flex>

          <div>
            <Flex sx={{ gap: '4px' }} alignItems="center" color={theme.subText} fontSize="12px">
              <TokenLogoWithChain chainId={tx.sourceChain as any} currency={tx.sourceToken} />-
              {formatDisplayNumber(formatUnits(BigInt(tx.inputAmount), tx.sourceToken.decimals), {
                significantDigits: 6,
              })}{' '}
              {tx.sourceToken.symbol}
            </Flex>
            <Flex sx={{ gap: '4px' }} alignItems="center" color={theme.subText} mt="8px" fontSize="12px">
              <TokenLogoWithChain chainId={tx.targetChain as any} currency={tx.targetToken} />+
              {formatDisplayNumber(formatUnits(BigInt(tx.outputAmount), tx.sourceToken.decimals), {
                significantDigits: 6,
              })}{' '}
              {tx.sourceToken.symbol}
            </Flex>
          </div>

          <div>
            <Flex justifyContent="flex-end" sx={{ gap: '4px' }} color={theme.subText}>
              <Text color={theme.text}>Deposit:</Text> {shortenHash(tx.sourceTxHash)}
              <ExternalLinkIcon
                color={theme.subText}
                size={16}
                href={getEtherscanLink(tx.sourceChain as any, tx.sourceTxHash, 'transaction')}
              />
            </Flex>

            <Flex justifyContent="flex-end" sx={{ gap: '4px' }} color={theme.subText} mt="8px">
              <Text color={theme.text}>Fill:</Text>{' '}
              {tx.targetTxHash ? (
                <>
                  {shortenHash(tx.targetTxHash)}
                  <ExternalLinkIcon
                    color={theme.subText}
                    size={16}
                    href={getEtherscanLink(tx.targetChain as any, tx.targetTxHash, 'transaction')}
                  />
                </>
              ) : (
                <Skeleton
                  height="18px"
                  width="98px"
                  baseColor={theme.background}
                  highlightColor={theme.buttonGray}
                  borderRadius="1rem"
                />
              )}
            </Flex>
          </div>
        </TableRow>
      ))}
    </>
  )
}
