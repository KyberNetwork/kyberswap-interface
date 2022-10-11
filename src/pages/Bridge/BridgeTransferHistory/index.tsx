import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

import { ITEMS_PER_PAGE } from '../consts'
import { getAmountReceive, getTokenSymbol } from '../utils'
import ActionCell from './ActionCell'
import RouteCell from './RouteCell'
import StatusBadge from './StatusBadge'
import TimeCell from './TimeCell'
import TokenCell from './TokenCell'
import useTransferHistory from './useTransferHistory'

dayjs.extend(utc)

const commonCSS = css`
  width: 100%;
  display: grid;
  grid-template-columns: 140px 160px 100px 1fr 80px;
  grid-template-areas: 'time status route bridged-amount action';
  align-items: center;
  padding: 0 16px;
`

const TableHeader = styled.div`
  ${commonCSS}
  height: 48px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 20px 20px 0 0;
`

const TableColumnText = styled.div<{ gridArea?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  ${({ gridArea }) => gridArea && `grid-area: ${gridArea};`}
`

const TableRow = styled.div`
  ${commonCSS}
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const PaginationButton = styled.button`
  flex: 0 0 36px;
  height: 36px;
  padding: 0px;
  margin: 0px;
  border: none;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  border-radius: 999px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.background};
  transition: color 150ms;

  &:active {
    color: ${({ theme }) => theme.text};
  }

  @media (hover: hover) {
    &:hover {
      color: ${({ theme }) => theme.text};
    }
  }

  &:disabled {
    color: ${({ theme }) => rgba(theme.subText, 0.4)};
    cursor: not-allowed;
  }
`

type Props = {
  className?: string
}
const TransferHistory: React.FC<Props> = ({ className }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [shouldShowLoading, setShouldShowLoading] = useState(true)
  const { range, transfers, isValidating, error, canGoNext, canGoPrevious, onClickNext, onClickPrevious } =
    useTransferHistory(account || '')

  const timeOutRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    // This is to ensure loading is displayed at least 1.5s
    const existingTimeout = timeOutRef.current

    if (isValidating) {
      setShouldShowLoading(true)
    } else {
      timeOutRef.current = setTimeout(() => {
        setShouldShowLoading(false)
      }, 1_500)
    }
    return () => {
      existingTimeout && clearTimeout(existingTimeout)
    }
  }, [isValidating])

  // todo: when transfers is [] and not, show different loading strategy
  // toast error
  if (shouldShowLoading) {
    return <LocalLoader />
  }

  const renderInvisibleRows = () => {
    if (transfers.length === ITEMS_PER_PAGE) {
      return null
    }

    return Array(ITEMS_PER_PAGE - transfers.length)
      .fill(0)
      .map((_, i) => {
        return (
          <TableRow
            key={i}
            style={{
              visibility: 'hidden',
            }}
          />
        )
      })
  }

  if (transfers.length === 0) {
    return (
      <Flex
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '56px',
          color: theme.subText,
          gap: '16px',
        }}
      >
        <Info size={48} />
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
          }}
        >
          Your transfer history is empty
        </Text>
      </Flex>
    )
  }

  return (
    <div className={className}>
      <TableHeader>
        <TableColumnText gridArea="time">CREATED</TableColumnText>
        <TableColumnText gridArea="status">STATUS</TableColumnText>
        <TableColumnText gridArea="route">ROUTE</TableColumnText>
        <TableColumnText gridArea="bridged-amount">BRIDGED AMOUNT</TableColumnText>
        <TableColumnText gridArea="action">ACTION</TableColumnText>
      </TableHeader>
      {transfers.map((transfer, i) => (
        <TableRow key={i}>
          <TimeCell
            timeString={transfer.inittime ? dayjs.utc(transfer.inittime).local().format('YYYY/MM/DD HH:mm') : ''}
          />
          <StatusBadge status={transfer.status} />
          <RouteCell fromChainID={Number(transfer.fromChainID)} toChainID={Number(transfer.toChainID)} />
          <TokenCell amount={getAmountReceive(transfer)} symbol={getTokenSymbol(transfer.pairid)} />
          <ActionCell url={`https://anyswap.net/explorer/tx?params=${transfer.txid}`} />
        </TableRow>
      ))}
      {renderInvisibleRows()}

      <Flex
        sx={{
          width: '100%',
          alignItems: 'center',
          marginTop: '16px',
        }}
      >
        <Flex
          sx={{
            flex: '1 1 100%',
          }}
        />

        <Flex
          sx={{
            flex: '0 0 84px',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <PaginationButton disabled={!canGoPrevious} onClick={onClickPrevious}>
            <ChevronLeft width={18} />
          </PaginationButton>
          <PaginationButton disabled={!canGoNext} onClick={onClickNext}>
            <ChevronRight width={18} />
          </PaginationButton>
        </Flex>

        <Flex
          sx={{
            flex: '1 1 100%',
            justifyContent: 'flex-end',
            fontSize: '12px',
            color: theme.subText,
          }}
        >
          {range[0]} - {range[1]}
        </Flex>
      </Flex>
    </div>
  )
}

export default styled(TransferHistory)`
  flex: 1;
  width: 100%;
`
