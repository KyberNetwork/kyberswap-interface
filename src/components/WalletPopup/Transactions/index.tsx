import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

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
  flex: 1;
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
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  gap: 14px;
  justify-content: space-between;
`

export default function ListTransaction() {
  const transactions = useSortRecentTransactions(false, true) // todo danh check nhiều có crash ???
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

  return (
    <Wrapper>
      <Tab activeTab={activeTab} setActiveTab={setActiveTab} />
      <ContentWrapper>
        {formatTransactions.length === 0 ? (
          <Flex
            justifyContent="center"
            flexDirection="column"
            alignItems="center"
            color={theme.subText}
            style={{ gap: 10, marginTop: 10 }}
          >
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
              <FixedSizeList
                height={height}
                width={width}
                itemSize={70}
                outerRef={onRefChange}
                itemCount={formatTransactions.length}
                itemData={formatTransactions}
              >
                {({ data, index, style }) => (
                  <TransactionItem style={style} transaction={data[index]} key={data[index].hash} />
                )}
              </FixedSizeList>
            )}
          </AutoSizer>
        )}
      </ContentWrapper>
    </Wrapper>
  )
}
