import { Trans, t } from '@lingui/macro'
import { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info, X } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'

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
import { useAppDispatch } from 'state/hooks'
import { clearAllPendingTransactions } from 'state/transactions/actions'
import { useSortRecentTransactions } from 'state/transactions/hooks'
import {
  TRANSACTION_GROUP,
  TransactionDetails,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'

import TransactionItem from './TransactionItem'

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
    const leftCol = rowRef.current?.querySelector('.left-column')
    const rightCol = rowRef.current?.querySelector('.right-column')
    if (leftCol && rightCol && rowRef.current) {
      const { paddingTop, paddingBottom, gap } = getComputedStyle(rowRef.current)
      const rowGap = parseFloat(gap)
      const warningHeight = rowRef.current.dataset.stalled === 'true' ? NUMBERS.STALL_WARNING_HEIGHT + rowGap : 0
      const rowNum = Math.max(leftCol.children.length, rightCol.children.length) + 1
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

let storedActiveTab = ''
function ListTransaction({ isMinimal }: { isMinimal: boolean }) {
  const transactions = useSortRecentTransactions(false)
  const cancellingOrderInfo = useCancellingOrders()
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

  const [activeTab, setActiveTab] = useState<TRANSACTION_GROUP | string>(storedActiveTab)
  const [openClearTxModal, setOpenClearTxModal] = useState(false)

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
    if (!node) return
    if (!node.classList.contains('ks-scrollbar')) {
      node.classList.add('ks-scrollbar')
    }
    // react-window's VariableSizeList sets overflow-x: auto inline; force hidden to match design.
    node.style.overflowX = 'hidden'
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
    const list: string[] = listTokenAddress.current.filter(address => !findCacheToken(address, chainId))
    if (list.length) fetchListTokenByAddresses(list, chainId).catch(console.error)
  }, [total, isLoadedTokenDefault, chainId])

  useEffect(() => {
    storedActiveTab = activeTab
  }, [activeTab])

  return (
    <>
      <Modal isOpen={openClearTxModal} onDismiss={toggleClearTxModal}>
        <div className="flex w-full flex-col items-center justify-center gap-6 rounded-[20px] bg-tableHeader p-5 text-subText">
          <RowBetween className="items-start">
            <span className="text-xl font-medium text-text">{t`Clear All Pending Transactions`}</span>
            <X className="cursor-pointer text-text" onClick={toggleClearTxModal} />
          </RowBetween>
          <Row className="gap-3">
            <span className="text-sm leading-4 text-text">
              {t`Are you sure you want to clear all pending transactions? This will remove them from your list but will not affect their status on-chain.`}
            </span>
          </Row>
          <Row className="flex-row gap-4 max-xs:flex-col">
            <ButtonOutlined onClick={toggleClearTxModal}>{t`Cancel`}</ButtonOutlined>
            <ButtonPrimary onClick={onClearAllPendingTransactions}>{t`Clear All`}</ButtonPrimary>
          </Row>
        </div>
      </Modal>
      <div className="flex w-full flex-1 flex-col gap-3 overflow-hidden">
        <Tab<TRANSACTION_GROUP | string> activeTab={activeTab} setActiveTab={setActiveTab} tabs={filterTab} />
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden">
          {formatTransactions.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-2.5 text-subText">
              <Info size={32} />
              <span className="text-sm">
                <Trans>You have no Transaction History.</Trans>
              </span>
            </div>
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
        </div>
        {pendingTransactions.length !== 0 && (
          <div className="flex cursor-pointer items-center gap-[5px] text-sm text-primary">
            <span className="text-sm" onClick={toggleClearTxModal}>{t`Clear Pending Transactions`}</span>
            <InfoHelper
              className="text-primary"
              text={t`Manually clear this transaction from the pending list. This will not affect its on-chain status.`}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default memo(ListTransaction)
