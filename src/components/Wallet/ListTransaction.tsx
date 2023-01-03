import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, findCacheToken, useIsLoadedTokenDefault } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useSortRecentTransactions } from 'state/transactions/hooks'
import {
  TRANSACTION_GROUP,
  TransactionDetails,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'

import TransactionItem from './TransactionItem'

const Wrapper = styled.div`
  width: 100%;
  flex: 1;
  overflow-y: scroll;
`

const TabWrapper = styled(Row)`
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  justify-content: space-between;
  padding: 3px;
`

const getCssTabActive = (theme: DefaultTheme) => css`
  border-radius: 20px;
  background-color: ${theme.tabActive};
`
const TabItem = styled.div<{ active: boolean }>`
  padding: 6px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  :hover {
    ${({ theme }) => getCssTabActive(theme)}
  }
  ${({ theme, active }) => active && getCssTabActive(theme)}
`
const lisTab = [
  { text: t`All`, value: '' },
  { text: t`Swaps`, value: TRANSACTION_GROUP.SWAP },
  { text: t`Liquidity`, value: TRANSACTION_GROUP.LIQUIDITY },
  { text: t`Transfers`, value: TRANSACTION_GROUP.TRANSFER },
  { text: t`KyberDAO`, value: TRANSACTION_GROUP.KYBERDAO },
  { text: t`Others`, value: TRANSACTION_GROUP.OTHER },
]
export default function ListTransaction() {
  const transactions = useSortRecentTransactions(false, true) // todo danh firebase , check nhiều có crash ???
  const { chainId } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState<TRANSACTION_GROUP | string>('')
  const theme = useTheme()

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
    if (list.length) fetchListTokenByAddresses(list, chainId).catch(console.error) // todo danh ask: maxium tokens, transaction status
  }, [total, isLoadedTokenDefault, chainId])

  return (
    <>
      <TabWrapper>
        {lisTab.map(tab => (
          <TabItem key={tab.text} active={activeTab === tab.value} onClick={() => setActiveTab(tab.value)}>
            {tab.text}
          </TabItem>
        ))}
      </TabWrapper>
      <Wrapper>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemSize={70}
              itemCount={formatTransactions.length}
              itemData={formatTransactions}
            >
              {({ data, index, style }) => (
                <TransactionItem style={style} transaction={data[index]} key={data[index].hash} />
              )}
            </FixedSizeList>
          )}
        </AutoSizer>
        {formatTransactions.length === 0 && (
          <Flex
            justifyContent="center"
            flexDirection="column"
            alignItems="center"
            color={theme.subText}
            style={{ gap: 10, marginTop: 10 }}
          >
            <Info size={33} />
            <Text>
              <Trans>You have no Transaction History</Trans>
            </Text>
          </Flex>
        )}
      </Wrapper>
    </>
  )
}
