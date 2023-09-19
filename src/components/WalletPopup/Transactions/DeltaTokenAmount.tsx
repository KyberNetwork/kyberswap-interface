import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode } from 'react'
import styled, { CSSProperties } from 'styled-components'

import { TokenLogoWithChain, TokenLogoWithShadow } from 'components/Logo'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { getTokenLogo } from 'components/WalletPopup/Transactions/helper'
import useTheme from 'hooks/useTheme'

export const TokenAmountWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
`

const DeltaTokenAmount = ({
  symbol,
  amount,
  tokenAddress,
  plus,
  color: customColor,
  logoURL,
  chainId,
  style,
}: {
  symbol?: string
  amount?: ReactNode
  tokenAddress?: string
  plus?: boolean
  color?: string
  logoURL?: string
  chainId?: ChainId
  style?: CSSProperties
}) => {
  const withSign = plus !== undefined
  const theme = useTheme()
  const sign = amount === undefined || !withSign ? null : plus ? '+' : '-'
  const color = customColor ?? (plus ? theme.primary : theme.subText)
  const logoUrl = logoURL || getTokenLogo(tokenAddress)
  if (!amount && amount !== null) return null
  return (
    <TokenAmountWrapper style={style}>
      {logoUrl &&
        (chainId ? (
          <TokenLogoWithChain tokenLogo={logoUrl} chainId={chainId} size={12} />
        ) : (
          <TokenLogoWithShadow size="12px" srcs={[logoUrl]} />
        ))}
      <PrimaryText style={{ color }}>
        {sign} {amount} {symbol}
      </PrimaryText>
    </TokenAmountWrapper>
  )
}

export default DeltaTokenAmount
