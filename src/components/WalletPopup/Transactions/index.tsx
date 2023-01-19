import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Tab from 'components/WalletPopup/Transactions/Tab'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, findCacheToken, useIsLoadedTokenDefault } from 'hooks/Tokens'
import { isSupportKyberDao } from 'hooks/kyberdao'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useTheme from 'hooks/useTheme'
import { useSortRecentTransactions } from 'state/transactions/hooks'
import {
  TRANSACTION_GROUP,
  TransactionDetails,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'

import TransactionItem from './TransactionItem'

const ContentWrapper = styled.div`
  width: 100%;
  flex: 1 1 0;
  overflow-y: auto;
  overflow-x: hidden;
  .scrollbar {
    &::-webkit-scrollbar {
      display: block;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.border};
    }
  }
`

const Wrapper = styled.div`
  width: 100%;
  flex: 1 1 0;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: 12px;
`

function Row({
  index,
  style,
  transaction,
  setRowHeight,
  isMinimal,
}: {
  transaction: TransactionDetails
  style: CSSProperties
  index: number
  setRowHeight: (v: number, height: number) => void
  isMinimal: boolean
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (rowRef.current) {
      const [, child2] = rowRef.current.children // todo danh
      const [sub1, sub2] = child2.children
      const rowNum = Math.max(sub1.children.length, sub2.children.length) + 1
      setRowHeight(index, rowNum === 2 ? 76 : 98)
    }
  }, [rowRef, index, setRowHeight])

  return <TransactionItem isMinimal={isMinimal} ref={rowRef} style={style} transaction={transaction} />
}

export default function ListTransaction({ isMinimal }: { isMinimal: boolean }) {
  const transactions = useSortRecentTransactions(false)
  const { chainId } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState<TRANSACTION_GROUP | string>('')
  const theme = useTheme()
  const changeNetwork = useChangeNetwork()

  const listTokenAddress = useRef<string[]>([])
  const pushAddress = (address: string) => {
    if (address && !listTokenAddress.current.includes(address)) listTokenAddress.current.push(address)
  }

  const formatTransactions = useMemo(() => {
    const result: TransactionDetails[] = []
    transactions.forEach(list => {
      list.forEach(txs => {
        if (!activeTab || txs.group === activeTab) {
          result.push(txs)
          const { tokenAddress } = (txs.extraInfo as TransactionExtraInfo1Token) ?? {}
          const { tokenAddressIn, tokenAddressOut } = (txs.extraInfo as TransactionExtraInfo2Token) ?? {}
          pushAddress(tokenAddress)
          pushAddress(tokenAddressIn)
          pushAddress(tokenAddressOut)
        }
      })
    })

    return result
  }, [transactions, activeTab])

  const total = listTokenAddress.current
  const isLoadedTokenDefault = useIsLoadedTokenDefault()
  useEffect(() => {
    if (!isLoadedTokenDefault) return
    const list: string[] = listTokenAddress.current.filter(address => !findCacheToken(address))
    if (list.length) fetchListTokenByAddresses(list, chainId).catch(console.error) // todo danh ask: maxium tokens, transaction status, reset
  }, [total, isLoadedTokenDefault, chainId])

  const onRefChange = useCallback((node: HTMLDivElement) => {
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [])

  const rowHeights = useRef<{ [key: string]: number }>({})
  const listRef = useRef<any>(null)
  const setRowHeight = useCallback((index: number, size: number) => {
    listRef.current?.resetAfterIndex(0)
    rowHeights.current = { ...rowHeights.current, [index]: size }
  }, [])

  function getRowHeight(index: number) {
    return rowHeights.current[index] || 100
  }

  return (
    <Wrapper>
      <Tab activeTab={activeTab} setActiveTab={setActiveTab} />
      <ContentWrapper>
        {formatTransactions.length === 0 ? (
          <Flex flexDirection="column" alignItems="center" color={theme.subText} sx={{ gap: 10 }}>
            <Info size={33} />
            {activeTab === TRANSACTION_GROUP.KYBERDAO && !isSupportKyberDao(chainId) ? (
              <>
                <Text textAlign="center" lineHeight="24px">
                  <Trans>
                    Staking KNC is only available on Ethereum chain. Please switch your network to see your KyberDAO
                    transactions
                  </Trans>
                </Text>
                <Text
                  color={theme.primary}
                  style={{ cursor: 'pointer' }}
                  onClick={() => changeNetwork(ChainId.MAINNET)}
                >
                  <Trans>Switch Network</Trans>
                </Text>
              </>
            ) : (
              <Text>
                <Trans>You have no Transaction History</Trans>
              </Text>
            )}
          </Flex>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <VariableSizeList
                height={height}
                width={width}
                itemSize={getRowHeight}
                ref={listRef}
                outerRef={onRefChange}
                itemCount={formatTransactions.length}
                itemData={formatTransactions}
              >
                {({ data, index, style }) => (
                  <Row
                    isMinimal={isMinimal}
                    style={style}
                    transaction={data[index]}
                    index={index}
                    key={data[index].hash}
                    setRowHeight={setRowHeight}
                  />
                )}
              </VariableSizeList>
            )}
          </AutoSizer>
        )}
      </ContentWrapper>
    </Wrapper>
  )
}
