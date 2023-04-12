import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { Info, Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'
import styled, { css } from 'styled-components'

import { formatUSDValue } from 'components/EarningAreaChart/utils'
import Logo from 'components/Logo'
import useTheme from 'hooks/useTheme'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import OriginalMyEarningsOverTimePanel from 'pages/MyEarnings/MyEarningsOverTimePanel'
import { Wrapper } from 'pages/MyEarnings/SinglePosition'
import { calculateEarningStatsTick } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { EarningStatsTick } from 'types/myEarnings'
import { formattedNumLong } from 'utils'

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  padding: 0;
  border: none;
  background: unset;
`

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 4px 16px;
  justify-content: space-between;
`

const TextAPR = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;

  color: ${({ theme }) => theme.apr};
`

const Label = styled.span<{ $hasTooltip?: boolean }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};

  ${({ $hasTooltip, theme }) =>
    $hasTooltip
      ? css`
          text-decoration-line: underline;
          text-decoration-style: dashed;
          text-decoration-color: ${theme.subText};
        `
      : ''};
`

type Props = {
  chainId: ChainId
  positionEarning: PositionEarningWithDetails
  onFlipView: () => void
}
const EarningView: React.FC<Props> = ({ onFlipView, positionEarning, chainId }) => {
  const theme = useTheme()

  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  // format pool value
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateEarningStatsTick(positionEarning.historicalEarning, chainId, tokensByChainId)
  }, [chainId, positionEarning.historicalEarning, tokensByChainId])

  const earningToday = ticks?.[0]

  return (
    <Wrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Text
            sx={{
              color: theme.primary,
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '20px',
            }}
          >
            #{positionEarning.id}
          </Text>

          <Flex
            sx={{
              width: '24px',
              height: '24px',
              borderRadius: '999px',
              justifyContent: 'center',
              alignItems: 'center',
              background: rgba(theme.primary, 0.3),
            }}
          >
            <Info size={16} color={theme.primary} />
          </Flex>
        </Flex>

        <Flex
          sx={{
            flexDirection: 'column',
            gap: '4px 16px',
          }}
        >
          <Label>Total Earnings</Label>

          <HoverDropdown
            anchor={earningToday ? formatUSDValue(earningToday.totalValue, false) : '--'}
            text={
              <>
                {earningToday?.tokens.map((token, index) => (
                  <Flex
                    alignItems="center"
                    key={index}
                    sx={{
                      gap: '4px',
                    }}
                  >
                    <Logo srcs={[token.logoUrl]} style={{ flex: '0 0 16px', height: '16px', borderRadius: '999px' }} />
                    <Text fontSize={12}>
                      {formattedNumLong(token.amount, false)} {token.symbol}
                    </Text>
                  </Flex>
                ))}
              </>
            }
          />
        </Flex>

        <GridWrapper>
          <Label>My Pool APR</Label>
          <Label $hasTooltip>My Farm APR</Label>

          <TextAPR>--</TextAPR>
          <TextAPR>--</TextAPR>
        </GridWrapper>

        <Flex
          sx={{
            width: '100%',
            flex: '1 0 360px',
          }}
        >
          <MyEarningsOverTimePanel isLoading={false} ticks={ticks} isContainerSmall />
        </Flex>
      </Flex>

      <Flex
        role="button"
        onClick={onFlipView}
        justifyContent="center"
        alignItems="center"
        sx={{
          flex: '0 0 fit-content',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
          gap: '4px',
          cursor: 'pointer',
        }}
      >
        <Repeat size={12} />
        <Trans>View Positions</Trans>
      </Flex>
    </Wrapper>
  )
}

export default EarningView
