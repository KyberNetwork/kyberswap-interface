import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import LocalLoader from 'components/LocalLoader'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import AllPositionLegacy from './AllPositionLegacy'
import FarmLegacy from './FarmLegacy'
import PositionLegacy from './PositionLegacy'

const Wrapper = styled.div`
  border-radius: 24px;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px 20px;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.subText};
`

const Warning = styled(Wrapper)`
  background: ${({ theme }) => rgba(theme.warning, 0.3)};
  border: none;
  color: ${({ theme }) => theme.text};
`
const Notice = ({ isFarm }: { isFarm?: boolean }) => {
  const theme = useTheme()
  return (
    <Wrapper>
      <Trans>
        Due to a potential issue with our legacy{' '}
        <Text as="span" color={theme.text}>
          Elastic protocol
        </Text>
        , we have permanently paused our{' '}
        <Text as="span" color={theme.text}>
          Elastic {isFarm ? 'Farms' : 'Pools'} (Legacy)
        </Text>
        . If you wish to participate in our {isFarm ? 'farms' : 'pools'}, check out our new and audited{' '}
        <Link to={isFarm ? '/farms' : '/pools'}>Elastic {isFarm ? 'Farms' : 'Pools'}</Link>
      </Trans>
    </Wrapper>
  )
}

const WarningNotice = () => {
  const theme = useTheme()
  return (
    <Warning>
      <Trans>
        Due to a{' '}
        <ExternalLink href="https://twitter.com/KyberNetwork/status/1647920799557505028?t=3W5CxZULDimB9AgGKFHQ2w&s=19">
          <Text as="span" color={theme.warning}>
            potential issue
          </Text>
        </ExternalLink>{' '}
        with our legacy Elastic protocol, we recommend that all liquidity providers withdraw their liquidity from
        Elastic Pools (Legacy). We have fixed all the issues and deployed the new and audited{' '}
        <Link to="/pools">Elastic Pools</Link> where you can add liquidity normally instead
      </Trans>
    </Warning>
  )
}

export default function ElasticLegacy({ tab }: { tab: 'farm' | 'position' | 'my_positions' }) {
  const { loading, positions, farmPositions, allPositions } = useElasticLegacy()
  const { loading: loadingCompensationData, data: farmRewardData, claimInfo } = useElasticCompensationData()
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length || !!farmPositions.length

  if (loading || loadingCompensationData) {
    return <LocalLoader />
  }

  return (
    <>
      <div />
      {tab === 'farm' &&
        (shouldShowFarmTab ? (
          <>
            <WarningNotice />
            <FarmLegacy
              claimInfo={claimInfo}
              farmPositions={farmPositions.map(item => {
                const reward = farmRewardData?.find(frd => frd.nftid.toString() === item.id)
                return {
                  ...item,
                  pendingRewards: reward?.pending_rewards || [],
                }
              })}
              pendingRewards={(farmRewardData || []).map(item => item.pending_rewards).flat()}
            />
          </>
        ) : (
          <Notice isFarm={true} />
        ))}
      {tab === 'position' &&
        (shouldShowPositionTab ? (
          <>
            <WarningNotice />
            <PositionLegacy positions={[...positions, ...farmPositions]} />
          </>
        ) : (
          <Notice />
        ))}

      {tab === 'my_positions' && (
        <Flex flexDirection="column" marginTop="1.5rem">
          <WarningNotice />
          <AllPositionLegacy positions={[...allPositions, ...farmPositions]} />
        </Flex>
      )}
    </>
  )
}
