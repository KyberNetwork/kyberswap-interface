import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Info } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'

const Wrapper = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  padding: 8px 16px;
  color: ${({ theme }) => theme.subText};
  border-radius: 1rem;
  display: flex;
  align-items: center;
`

export default function Notice() {
  const { account } = useActiveWeb3React()
  const { positions, farmPositions } = useElasticLegacy(false)
  const { claimInfo } = useElasticCompensationData(false)
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length

  if (!shouldShowFarmTab && !shouldShowPositionTab) return null

  return (
    <Wrapper>
      <Info size={20} />
      <Text marginLeft="8px">
        <Trans>
          Note: Due to a potential security issue with our Elastic Legacy contract, we have deployed a new Elastic
          contract. To ensure the safety of your funds, we recommend that all Liquidity Providers withdraw their funds
          from Elastic Legacy as soon as possible and add them to the new Elastic Pools. If you have not already done
          so, please do it immediately by visiting this <Link to={`/elastic-legacy?account=${account}`}>link</Link>.
        </Trans>
      </Text>
    </Wrapper>
  )
}
