import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { Edit3, Trash } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Checkbox from 'components/CheckBox'
import Logo from 'components/Logo'
import ProgressBar from 'components/ProgressBar'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import { LimitOrder } from '../type'

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
`

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
      <Text color={theme.subText}>{dayjs(time).format('DD/MM/YYYY')}</Text>
      &nbsp; <Text color={theme.border}>{dayjs(time).format('hh:mm')}</Text>
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
const AmountInfo = ({ order }: { order: LimitOrder }) => {
  const theme = useTheme()
  return (
    <Colum>
      <Flex alignItems={'center'}>
        <TokenLogo srcs={[order.makerAssetLogoURL]} />{' '}
        <DeltaAmount color={theme.primary}>+ 0.25 {order.makerAssetSymbol}</DeltaAmount>
      </Flex>
      <Flex alignItems={'center'}>
        <TokenLogo srcs={[order.makerAssetLogoURL]} />{' '}
        <DeltaAmount color={theme.border}>- 0.25 {order.takerAssetSymbol}</DeltaAmount>
      </Flex>
    </Colum>
  )
}

const caclPercent = (value: string, total: string) => {
  return value
  // return new Fraction(value * 10 ** 9, 10 ** 9)
  //   .multiply(100)
  //   .divide(new Fraction(total * 10 ** 9, 10 ** 9))
  //   .toFixed(2)
}
export default function OrderItem({ order }: { order: LimitOrder }) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const {
    createdAt = Date.now(),
    expiredAt = Date.now(),
    makingAmount,
    takingAmount,
    filledMakingAmount,
    filledTakingAmount,
  } = order

  const filledPercent = caclPercent(filledTakingAmount, takingAmount)
  console.log(142, filledPercent)

  if (upToSmall)
    return (
      <ItemWrapperMobile>
        <Flex justifyContent={'space-between'}>
          <AmountInfo order={order} />
          <Actions />
        </Flex>
        <Flex justifyContent={'space-between'}>
          <ProgressBar height="11px" percent={66} title={`Partially Filled: 25%`} />
          <Time time={createdAt} />
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
      <Colum>
        <Time time={createdAt} />
        <Time time={expiredAt} />
      </Colum>
      <Colum>
        <Time time={createdAt} />
        <Time time={expiredAt} />
      </Colum>
      <Colum>
        <ProgressBar height="11px" percent={66} title={`Partially Filled: 25%`} />
      </Colum>
      <Actions />
    </ItemWrapper>
  )
}
