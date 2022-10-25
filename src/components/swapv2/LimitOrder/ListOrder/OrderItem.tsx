import { Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { useState } from 'react'
import { Edit3, Repeat, Trash } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Checkbox from 'components/CheckBox'
import Logo from 'components/Logo'
import ProgressBar from 'components/ProgressBar'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatNumberWithPrecisionRange } from 'utils'

import { LimitOrder, LimitOrderStatus } from '../type'

const IconWrap = styled.div<{ color: string }>`
  background-color: ${({ color }) => `${rgba(color, 0.2)}`};
  border-radius: 24px;
  padding: 7px 8px 5px 8px;
  height: fit-content;
  margin-left: 5px;
`

export const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 12px;
  padding: 10px;
  grid-template-columns: 1.5fr 1fr 1.5fr 2fr 80px;
  display: grid;
  gap: 10px;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1.5fr 1.5fr 1.5fr 80px;
    .rate {
      display:none;
    }
  `}
`
// todo reponsive
const ItemWrapperMobile = styled.div`
  display: flex;
  font-size: 12px;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 0px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const DeltaAmount = styled.div<{ color: string }>`
  font-weight: 500;
  color: ${({ color }) => color};
  margin-left: 8px;
`
const Colum = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px 12px;
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
      gap: 5px 12px;
  `}
`

const Time = ({ time }: { time: number }) => {
  const theme = useTheme()
  return (
    <Flex fontWeight={'500'}>
      <Text color={theme.subText}>{dayjs(time * 1000).format('DD/MM/YYYY')}</Text>
      &nbsp; <Text color={theme.border}>{dayjs(time * 1000).format('HH:mm')}</Text>
    </Flex>
  )
}

const Actions = () => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'}>
      <IconWrap color={theme.primary}>
        <MouseoverTooltip text={t`Edit`} placement="top" width="60px">
          <Edit3 color={theme.primary} size={15} />
        </MouseoverTooltip>
      </IconWrap>
      <MouseoverTooltip text={t`Cancel`} placement="top" width="80px">
        <IconWrap color={theme.red}>
          <Trash color={theme.red} size={15} />
        </IconWrap>
      </MouseoverTooltip>
    </Flex>
  )
}
const TokenLogo = styled(Logo)`
  width: 17px;
  height: 17px;
  border-radius: 100%;
`
const formatNumber = (uint256: string) => {
  return formatNumberWithPrecisionRange(parseFloat(uint256ToFraction(uint256).toSignificant(10)), 2)
}
const AmountInfo = ({ order }: { order: LimitOrder }) => {
  const { makerAssetSymbol, makerAssetLogoURL, takerAssetLogoURL, takerAssetSymbol, makingAmount, takingAmount } = order
  const theme = useTheme()
  return (
    <Colum>
      <Flex alignItems={'center'}>
        <TokenLogo srcs={[takerAssetLogoURL]} />{' '}
        <DeltaAmount color={theme.primary}>
          + {formatNumber(takingAmount)} {takerAssetSymbol}
        </DeltaAmount>
      </Flex>
      <Flex alignItems={'center'}>
        <TokenLogo srcs={[makerAssetLogoURL]} />{' '}
        <DeltaAmount color={theme.border}>
          - {formatNumber(makingAmount)} {makerAssetSymbol}
        </DeltaAmount>
      </Flex>
    </Colum>
  )
}

const uint256ToFraction = (value: string, decimals = 18) =>
  new Fraction(value, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

const calcPercent = (value: string, total: string, decimals = 18) => {
  try {
    return parseInt(
      uint256ToFraction(value, decimals).divide(uint256ToFraction(total, decimals)).multiply(100).toFixed(0),
    )
  } catch (error) {
    console.log(error)
    return 0
  }
}

const TradeRate = ({ order, style = {} }: { order: LimitOrder; style?: CSSProperties }) => {
  const [invert, setInvert] = useState(false)
  const theme = useTheme()
  const { makerAssetSymbol, takerAssetSymbol, makingAmount, takingAmount } = order
  let rateValue = new Fraction(0)
  try {
    rateValue = invert
      ? uint256ToFraction(takingAmount).divide(uint256ToFraction(makingAmount))
      : uint256ToFraction(makingAmount).divide(uint256ToFraction(takingAmount))
  } catch (error) {
    console.log(error)
  }
  return (
    <div style={style}>
      <Flex style={{ gap: 6, cursor: 'pointer', alignItems: 'center' }} onClick={() => setInvert(!invert)}>
        <Text fontSize={14} color={theme.subText}>
          {invert ? `${takerAssetSymbol}/${makerAssetSymbol}` : `${makerAssetSymbol}/${takerAssetSymbol}`}
        </Text>
        <Repeat color={theme.subText} size={12} />
      </Flex>
      <Text color={theme.text}>{formatNumberWithPrecisionRange(parseFloat(rateValue.toSignificant(10)), 2)}</Text>
    </div>
  )
}
function formatStatus(status: string) {
  status = status.replace('_', ' ')
  return status.charAt(0).toUpperCase() + status.slice(1)
}
export default function OrderItem({ order }: { order: LimitOrder }) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { createdAt = Date.now(), expiredAt = Date.now(), takingAmount, filledTakingAmount, status } = order
  const filledPercent = calcPercent(filledTakingAmount, takingAmount)

  const theme = useTheme()
  // todo format number all
  const partiallyFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const MapStatusColor: { [key: string]: string } = {
    [LimitOrderStatus.FILLED]: theme.primary,
    [LimitOrderStatus.CANCELLED]: theme.red,
    [LimitOrderStatus.EXPRIED]: theme.warning,
    [LimitOrderStatus.PARTIALLY_FILLED]: theme.warning,
  }
  const expandTitle = [LimitOrderStatus.EXPRIED, LimitOrderStatus.CANCELLED].includes(status)
    ? ` | ${formatStatus(status)}`
    : ''
  const progressComponent = (
    <ProgressBar
      backgroundColor={theme.subText}
      color={MapStatusColor[status]}
      labelColor={MapStatusColor[status]}
      height="11px"
      percent={filledPercent}
      title={(partiallyFilled ? t`Partially Filled: ${filledPercent}%` : t`Filled ${filledPercent}%`) + expandTitle}
    />
  )

  if (upToSmall)
    return (
      <ItemWrapperMobile>
        <Flex justifyContent={'space-between'}>
          <AmountInfo order={order} />
          <Actions />
        </Flex>
        <Flex justifyContent={'space-between'}>
          {progressComponent}
          <TradeRate order={order} style={{ textAlign: 'right' }} />
        </Flex>
        <Flex justifyContent={'space-between'}>
          <Colum>
            <Text>
              <Trans>Created</Trans>
            </Text>
            <Time time={createdAt} />
          </Colum>
          <Colum>
            <Text textAlign={'right'}>
              <Trans>Expiry</Trans>
            </Text>
            <Time time={order.expiredAt} />
          </Colum>
        </Flex>
      </ItemWrapperMobile>
    )
  return (
    <ItemWrapper>
      <Flex style={{ gap: 10 }}>
        <Checkbox type="checkbox" />
        <AmountInfo order={order} />
      </Flex>
      <Colum className="rate">
        <TradeRate order={order} />
      </Colum>
      <Colum>
        <Time time={createdAt} />
        <Time time={expiredAt} />
      </Colum>
      <Colum>{progressComponent}</Colum>
      <Actions />
    </ItemWrapper>
  )
}
