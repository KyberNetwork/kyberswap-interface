import { ReactNode } from 'react'
import { Text } from 'rebass'
import { PoolDetail as PoolDetailData } from 'services/zapEarn'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'

import AddLiquidityWidget from './AddLiquidityWidget'

const WidgetShell = styled(Stack)`
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.tabActive};
  background: ${({ theme }) => theme.background};
`

const RouteSurface = styled(Stack)`
  border-radius: 16px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`

const RouteNodeShell = styled(Stack)`
  min-width: 0;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
`

const RouteLabel = styled(Text)`
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const RouteValue = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Connector = styled.div`
  width: 24px;
  height: 1px;
  flex: 0 0 auto;
  background: rgba(255, 255, 255, 0.16);
`

interface AddLiquidityProps {
  children?: ReactNode
  pool?: EarnPool
  poolDetail?: PoolDetailData
  route?: {
    exchange?: string
    poolAddress?: string
    chainId?: number
    tickLower?: string | null
    tickUpper?: string | null
  }
}

interface RouteNodeProps {
  label: string
  value: ReactNode
  flex?: string
}

const RouteNode = ({ label, value, flex = '1 1 0' }: RouteNodeProps) => {
  const theme = useTheme()

  return (
    <RouteNodeShell gap={4} flex={flex}>
      <RouteLabel color={theme.subText}>{label}</RouteLabel>
      <RouteValue color={theme.text}>{value}</RouteValue>
    </RouteNodeShell>
  )
}

const AddLiquidity = ({ children, pool, poolDetail, route }: AddLiquidityProps) => {
  const theme = useTheme()
  const token0Symbol = pool?.tokens?.[0]?.symbol || poolDetail?.tokens?.[0]?.symbol
  const token1Symbol = pool?.tokens?.[1]?.symbol || poolDetail?.tokens?.[1]?.symbol
  const pairLabel = token0Symbol && token1Symbol ? `${token0Symbol}/${token1Symbol}` : undefined
  const protocol = route?.exchange ? EARN_DEXES[route.exchange as Exchange]?.name || route.exchange : undefined

  return (
    <Stack gap={16} width="100%">
      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <Stack width="100%" maxWidth="480px" flex="1 1 480px" minWidth={0}>
          <WidgetShell>
            <AddLiquidityWidget
              exchange={route?.exchange}
              poolAddress={route?.poolAddress}
              chainId={route?.chainId}
              tickLower={route?.tickLower}
              tickUpper={route?.tickUpper}
              earnPool={pool}
            />
          </WidgetShell>
        </Stack>
        <Stack gap={16} flex="1 1 320px" minWidth={0}>
          <RouteSurface gap={20}>
            <Text m={0} color={theme.text} fontSize={18} fontWeight={600}>
              Route
            </Text>
            <Stack gap={12}>
              <HStack align="center" gap={8}>
                <RouteNode label="Input" value="Any supported token" />
                <Connector />
                <RouteNode label="Router" value={protocol || 'Best Route'} />
              </HStack>

              <HStack align="center" gap={8}>
                <Stack gap={10} flex="1 1 0" minWidth={0}>
                  <RouteNode label="Output Token 0" value={token0Symbol || 'Token 0'} flex="1 1 auto" />
                  <RouteNode label="Output Token 1" value={token1Symbol || 'Token 1'} flex="1 1 auto" />
                </Stack>
                <Connector />
                <RouteNode label="LP Position" value={pairLabel || 'Pool Position'} />
              </HStack>
            </Stack>
          </RouteSurface>
          {children}
        </Stack>
      </HStack>
    </Stack>
  )
}

export default AddLiquidity
