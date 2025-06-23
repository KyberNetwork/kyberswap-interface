import { Trans, t } from '@lingui/macro'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info, X } from 'react-feather'
import { useMedia } from 'react-use'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import Tab from 'components/WalletPopup/Transactions/Tab'
import { NUMBERS } from 'components/WalletPopup/Transactions/helper'
import useCancellingOrders, { CancellingOrderInfo } from 'components/swapv2/LimitOrder/useCancellingOrders'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, findCacheToken, useIsLoadedTokenDefault } from 'hooks/Tokens'
import { isSupportKyberDao } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { useAppDispatch } from 'state/hooks'
import { clearAllPendingTransactions } from 'state/transactions/actions'
import { useSortRecentTransactions } from 'state/transactions/hooks'
import {
  TRANSACTION_GROUP,
  TransactionDetails,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'

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
    overflow-x: hidden !important;
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

const ClearTxButton = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.primary};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
`

const ClearTxWrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  color: ${({ theme }) => theme.subText};
`

function RowItem({
  index,
  style,
  transaction,
  setRowHeight,
  isMinimal,
  cancellingOrderInfo,
}: {
  transaction: TransactionDetails
  style: CSSProperties
  index: number
  setRowHeight: (v: number, height: number) => void
  isMinimal: boolean
  cancellingOrderInfo: CancellingOrderInfo
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /** because react-window don't support dynamic height => manually calc height for each item
     *
     * --- warning ---
     * title
     * left    right
     *
     * => item height = warning_height + tile_height + max(height_left, height_right) + gap + padding
     */
    const leftCol = rowRef.current?.querySelector('.left-column')
    const rightCol = rowRef.current?.querySelector('.right-column')
    if (leftCol && rightCol && rowRef.current) {
      const { paddingTop, paddingBottom, gap } = getComputedStyle(rowRef.current)
      const rowGap = parseFloat(gap)
      const warningHeight = rowRef.current.dataset.stalled === 'true' ? NUMBERS.STALL_WARNING_HEIGHT + rowGap : 0
      const rowNum = Math.max(leftCol.children.length, rightCol.children.length) + 1 // 1 for title
      setRowHeight(
        index,
        parseFloat(paddingTop) +
          parseFloat(paddingBottom) +
          warningHeight +
          NUMBERS.TRANSACTION_LINE_HEIGHT * rowNum +
          (rowNum - 1) * rowGap,
      )
    }
  }, [rowRef, index, setRowHeight])

  return (
    <TransactionItem
      isMinimal={isMinimal}
      ref={rowRef}
      style={style}
      transaction={transaction}
      cancellingOrderInfo={cancellingOrderInfo}
    />
  )
}
// This is intentional, we don't need to persist in localStorage
let storedActiveTab = ''
function ListTransaction({ isMinimal }: { isMinimal: boolean }) {
  const transactions = useSortRecentTransactions(false)
  const theme = useTheme()
  const cancellingOrderInfo = useCancellingOrders()
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

  const [activeTab, setActiveTab] = useState<TRANSACTION_GROUP | string>(storedActiveTab)
  const [openClearTxModal, setOpenClearTxModal] = useState(false)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const listTokenAddress = useRef<string[]>([])
  const rowHeights = useRef<{ [key: string]: number }>({})
  const listRef = useRef<any>(null)

  const total = listTokenAddress.current
  const isLoadedTokenDefault = useIsLoadedTokenDefault()

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

  const pendingTransactions = formatTransactions.filter(tx => !tx.receipt)

  const listTab = useMemo(
    () => [
      { title: t`All`, value: '' },
      { title: t`Swaps`, value: TRANSACTION_GROUP.SWAP },
      { title: t`Liquidity`, value: TRANSACTION_GROUP.LIQUIDITY },
      { title: t`KyberDAO`, value: TRANSACTION_GROUP.KYBERDAO },
      { title: t`Others`, value: TRANSACTION_GROUP.OTHER },
    ],
    [],
  )

  const filterTab = useMemo(() => {
    return listTab.filter(tab => {
      if (tab.value === TRANSACTION_GROUP.KYBERDAO) {
        return isSupportKyberDao(chainId)
      }
      return true
    })
  }, [chainId, listTab])

  const onRefChange = useCallback((node: HTMLDivElement) => {
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [])

  const setRowHeight = useCallback((index: number, size: number) => {
    listRef.current?.resetAfterIndex(0)
    rowHeights.current = { ...rowHeights.current, [index]: size }
  }, [])

  function getRowHeight(index: number) {
    return rowHeights.current[index] || 100
  }

  const toggleClearTxModal = () => setOpenClearTxModal(prev => !prev)
  const onClearAllPendingTransactions = () => {
    dispatch(clearAllPendingTransactions({ chainId }))
    toggleClearTxModal()
  }

  useEffect(() => {
    if (!isLoadedTokenDefault) return
    const list: string[] = listTokenAddress.current.filter(address => !findCacheToken(address))
    if (list.length) fetchListTokenByAddresses(list, chainId).catch(console.error)
  }, [total, isLoadedTokenDefault, chainId])

  useEffect(() => {
    storedActiveTab = activeTab
  }, [activeTab])

  return (
    <>
      <Modal isOpen={openClearTxModal} onDismiss={toggleClearTxModal}>
        <ClearTxWrapper>
          <RowBetween align="start">
            <Text fontSize={20} fontWeight={500} color={theme.text}>
              {t`Clear All Pending Transactions`}
            </Text>
            <X color={theme.text} style={{ cursor: 'pointer' }} onClick={toggleClearTxModal} />
          </RowBetween>
          <Row gap="12px">
            <Text fontSize={14} color={theme.text} lineHeight="16px">
              {t`Are you sure you want to clear all pending transactions? This will remove them from your list but will not affect their status on-chain.`}
            </Text>
          </Row>
          <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
            <ButtonOutlined onClick={toggleClearTxModal}>{t`Cancel`}</ButtonOutlined>
            <ButtonPrimary onClick={onClearAllPendingTransactions}>{t`Clear All`}</ButtonPrimary>
          </Row>
        </ClearTxWrapper>
      </Modal>
      <Wrapper>
        <Tab<TRANSACTION_GROUP | string> activeTab={activeTab} setActiveTab={setActiveTab} tabs={filterTab} />
        <ContentWrapper>
          {formatTransactions.length === 0 ? (
            <Flex flexDirection="column" alignItems="center" color={theme.subText} sx={{ gap: 10, marginTop: '20px' }}>
              <Info size={32} />
              <Text fontSize={'14px'}>
                <Trans>You have no Transaction History.</Trans>
              </Text>
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
                    <RowItem
                      isMinimal={isMinimal}
                      style={style}
                      transaction={data[index]}
                      index={index}
                      key={data[index].hash}
                      setRowHeight={setRowHeight}
                      cancellingOrderInfo={cancellingOrderInfo}
                    />
                  )}
                </VariableSizeList>
              )}
            </AutoSizer>
          )}
        </ContentWrapper>
        {pendingTransactions.length !== 0 && (
          <ClearTxButton>
            <Text fontSize={14} onClick={toggleClearTxModal}>{t`Clear Pending Transactions`}</Text>
            <InfoHelper
              color={theme.primary}
              text={t`Manually clear this transaction from the pending list. This will not affect its on-chain status.`}
            />
          </ClearTxButton>
        )}
      </Wrapper>
    </>
  )
}

export default memo(ListTransaction)
