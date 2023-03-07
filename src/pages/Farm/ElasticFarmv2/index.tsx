import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import { RowBetween, RowFit, RowWrap } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'

import FarmCard from './components/FarmCard'

const Wrapper = styled.div`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FarmsWrapper = styled(RowWrap)`
  --items-in-row: 3;
  --gap: 24px;
`

export default function ElasticFarmv2() {
  const theme = useTheme()
  const whitelisted = useAllTokens()
  const inputToken = Object.values(whitelisted)?.filter(t => t.symbol === 'KNC')[0]
  const outputToken = Object.values(whitelisted)?.filter(t => t.symbol === 'USDC')[0]
  const elasticFarm = useElasticFarmsV2()
  const farms = elasticFarm?.farms
  const { chainId } = useActiveWeb3React()
  return (
    <Wrapper>
      <RowBetween>
        <Text fontSize="16px" lineHeight="20px" color={theme.text}>
          <Trans>Elastic Farm V2</Trans>
          {farms?.length}
        </Text>
        <RowFit>
          <ButtonPrimary height="36px">Approve</ButtonPrimary>
        </RowFit>
      </RowBetween>
      <Divider />
      <FarmsWrapper>
        {chainId === ChainId.GÖRLI ? (
          <>
            {farms?.map((farm: ElasticFarmV2) => (
              <FarmCard key={farm.id} inputToken={farm.pool.token0} outputToken={farm.pool.token1} farm={farm} />
            ))}
          </>
        ) : (
          <>
            <FarmCard inputToken={inputToken} outputToken={outputToken} />
            <FarmCard inputToken={inputToken} outputToken={outputToken} hasPositions hasRewards hasUnstake />
            <FarmCard inputToken={inputToken} outputToken={outputToken} enableStake />
          </>
        )}
      </FarmsWrapper>
    </Wrapper>
  )
}
