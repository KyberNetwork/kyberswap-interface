import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { formatUSDValue } from 'components/EarningAreaChart/utils'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import CommonView, { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import { Column, Label, Row, Value, ValueAPR } from 'pages/MyEarnings/ElasticPools/SinglePosition/styleds'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import OriginalMyEarningsOverTimePanel from 'pages/MyEarnings/MyEarningsOverTimePanel'
import { calculateEarningStatsTick } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { EarningStatsTick } from 'types/myEarnings'
import { formattedNumLong } from 'utils'

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  padding: 0;
  border: none;
  background: unset;
`

const EarningView: React.FC<CommonProps> = props => {
  const { positionEarning, chainId } = props
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  // format pool value
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateEarningStatsTick(positionEarning.historicalEarning, chainId, tokensByChainId)
  }, [chainId, positionEarning.historicalEarning, tokensByChainId])

  const earningToday = ticks?.[0]

  return (
    <CommonView isEarningView {...props}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '4px 16px',
        }}
      >
        <Label $hasTooltip>
          <MouseoverTooltip
            text={<Trans>Total earnings from both pool and farm (if applicable)</Trans>}
            placement="top"
          >
            <Trans>Total Earnings</Trans>
          </MouseoverTooltip>
        </Label>

        <HoverDropdown
          disabled={!earningToday?.totalValue}
          anchor={<Value>{earningToday ? formatUSDValue(earningToday.totalValue, false) : '--'}</Value>}
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

      <Column>
        <Row>
          <Label>
            <Trans>My Pool APR</Trans>
          </Label>
          <Label $hasTooltip>
            <Trans>My Farm APR</Trans>
          </Label>
        </Row>

        <Row>
          <ValueAPR>--</ValueAPR>
          <ValueAPR>--</ValueAPR>
        </Row>
      </Column>

      <Flex
        sx={{
          width: '100%',
          flex: '1 0 360px',
        }}
      >
        <MyEarningsOverTimePanel isLoading={false} ticks={ticks} isContainerSmall />
      </Flex>
    </CommonView>
  )
}

export default EarningView
