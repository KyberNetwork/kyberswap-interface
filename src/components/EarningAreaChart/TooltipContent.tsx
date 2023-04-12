import { Trans } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { useEffect } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Logo from 'components/Logo'
import useTheme from 'hooks/useTheme'
import { EarningStatsTick } from 'types/myEarnings'
import { formattedNumLong } from 'utils'

import { formatUSDValue } from './utils'

const TokensWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

const formatTokenAmount = (a: number) => {
  return formattedNumLong(a, false)
}

type TokensProps = {
  tokens: Array<{
    logoUrl: string
    amount: number
  }>
}

const Tokens: React.FC<TokensProps> = ({ tokens }) => {
  return (
    <TokensWrapper>
      {tokens.map((token, i) => {
        return (
          <Flex
            key={i}
            alignItems="center"
            sx={{
              gap: '4px',
            }}
          >
            <Logo srcs={[token.logoUrl]} style={{ width: 16, height: 16, borderRadius: '999px' }} />
            <Text
              as="span"
              sx={{
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '14px',
              }}
            >
              {formatTokenAmount(token.amount)}
            </Text>
          </Flex>
        )
      })}
    </TokensWrapper>
  )
}

type Props = {
  setHoverValue: React.Dispatch<React.SetStateAction<number | null>>
  dataEntry: EarningStatsTick
}
const TooltipContent: React.FC<Props> = ({ dataEntry, setHoverValue }) => {
  const theme = useTheme()

  useEffect(() => {
    setHoverValue(dataEntry.totalValue)
  }, [dataEntry.totalValue, setHoverValue])

  return (
    <Flex
      padding="12px"
      width="min-content"
      flexDirection="column"
      sx={{
        gap: '8px',
        background: rgba(theme.buttonBlack, 0.9),
        borderRadius: '12px',
        border: `1px solid ${darken(0.2, theme.border)}`,
      }}
    >
      <Text
        as="span"
        sx={{
          fontSize: '10px',
          color: theme.subText,
        }}
      >
        {dataEntry.date}
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '16px',
          color: theme.text,
          whiteSpace: 'nowrap',
        }}
      >
        <Trans>My Total Earnings</Trans>: <span>{formatUSDValue(dataEntry.totalValue)}</span>
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '16px',
          color: theme.blue,
          whiteSpace: 'nowrap',
        }}
      >
        <Trans>Pool Rewards</Trans>: <span>{formatUSDValue(dataEntry.poolRewardsValue)}</span>
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '16px',
          color: theme.primary,
          whiteSpace: 'nowrap',
        }}
      >
        <Trans>Farm Rewards</Trans>: <span>{formatUSDValue(dataEntry.farmRewardsValue)}</span>
      </Text>

      <Flex
        sx={{
          width: '100%',
          height: '0',
          borderBottom: `1px solid ${theme.border}`,
        }}
      />

      <Tokens tokens={dataEntry.tokens} />
    </Flex>
  )
}

export default TooltipContent
