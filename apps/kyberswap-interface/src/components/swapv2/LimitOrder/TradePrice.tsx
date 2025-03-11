import { Trans } from '@lingui/macro'
import React, { CSSProperties, ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'

import Dots from 'components/Dots'
import { removeTrailingZero } from 'components/swapv2/LimitOrder/helpers'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'

interface TradePriceProps {
  price: BaseTradeInfo | undefined
  style: CSSProperties
  label?: string
  color?: string
  symbolIn: string | undefined
  symbolOut: string | undefined
  loading: boolean
  icon?: ReactNode
}

export default function TradePrice({
  price,
  style = {},
  label,
  color,
  symbolIn,
  symbolOut,
  loading,
  icon,
}: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    if (price) {
      formattedPrice = showInverted
        ? removeTrailingZero(price?.invertRate.toPrecision(6))
        : removeTrailingZero(price?.marketRate.toPrecision(6))
    }
  } catch (error) {}

  const show = Boolean(price?.marketRate && price?.invertRate && formattedPrice && !loading)
  const value = showInverted
    ? `1 ${symbolOut} = ${formattedPrice} ${symbolIn}`
    : `1 ${symbolIn} = ${formattedPrice} ${symbolOut}`

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      sx={{ alignItems: 'center', display: 'flex', lineHeight: '14px', cursor: show ? 'pointer' : 'default', ...style }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>}
          <Text color={color}>{value}</Text>
          <StyledBalanceMaxMini hover={!icon}>{icon || <Repeat size={12} />}</StyledBalanceMaxMini>
        </>
      ) : loading ? (
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      ) : (
        <Text color={theme.warning}>
          <Trans>Unable to get the market price</Trans>
        </Text>
      )}
    </Text>
  )
}
