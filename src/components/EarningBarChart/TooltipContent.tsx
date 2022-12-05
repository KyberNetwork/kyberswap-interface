import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { EarningStatsAtTime } from 'types/myEarnings'
import { formattedNumLong } from 'utils'

import { displayConfig } from '.'
import { formatUSDValue } from './utilts'

const TokensWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;

  align-items: center;
  gap: 4px 8px;
  color: ${({ theme }) => theme.subText};
`
const StyledLogo = styled.img`
  width: 16px;
  height: auto;
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

            <StyledLogo src={token.logoUrl} alt={'token_name'} />
          </Flex>
        )
      })}
    </TokensWrapper>
  )
}

type Props = {
  dataEntry: EarningStatsAtTime
}
const TooltipContent: React.FC<Props> = ({ dataEntry }) => {
  const theme = useTheme()

  return (
    <Flex
      padding="12px"
      width="200px"
      flexDirection="column"
      sx={{
        gap: '12px',
        background: theme.tableHeader,
        borderRadius: '4px',
        border: `1px solid ${darken(0.2, theme.border)}`,
      }}
    >
      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '16px',
          color: theme.subText,
        }}
      >
        <Trans>Total Earnings:</Trans>{' '}
        <Text
          as="span"
          sx={{
            color: theme.text,
          }}
        >
          {formatUSDValue(dataEntry.pool.totalValue + dataEntry.farm.totalValue)}
        </Text>
      </Text>

      <Flex
        sx={{
          width: '100%',
          height: '0',
          borderBottom: `1px solid ${theme.border}`,
        }}
      />

      <Flex
        flexDirection="column"
        sx={{
          gap: '4px',
        }}
      >
        <Text
          as="span"
          sx={{
            fontSize: '14px',
            lineHeight: '16px',
            color: displayConfig.farm.color,
          }}
        >
          <Trans>Farm Rewards:</Trans> <b>{formatUSDValue(dataEntry.farm.totalValue)}</b>
        </Text>

        <Tokens tokens={dataEntry.farm.tokens} />
      </Flex>

      <Flex
        flexDirection="column"
        sx={{
          gap: '4px',
        }}
      >
        <Text
          as="span"
          sx={{
            fontSize: '14px',
            lineHeight: '16px',
            color: displayConfig.pool.color,
          }}
        >
          <Trans>Pool Rewards:</Trans> <b>{formatUSDValue(dataEntry.pool.totalValue)}</b>
        </Text>

        <Tokens tokens={dataEntry.pool.tokens} />
      </Flex>
    </Flex>
  )
}

export default TooltipContent
