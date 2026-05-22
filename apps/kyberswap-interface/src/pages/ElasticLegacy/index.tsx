import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import { ExternalLink } from 'theme'

import AllPositionLegacy from './AllPositionLegacy'
import FarmLegacy from './FarmLegacy'
import PositionLegacy from './PositionLegacy'

const Notice = ({ isFarm }: { isFarm?: boolean }) => (
  <div className="rounded-3xl border border-solid border-border bg-background px-5 py-3 text-sm leading-normal text-subText">
    <Trans>
      Due to a potential issue with our legacy <span className="text-text">Elastic protocol</span>, we have permanently
      paused our <span className="text-text">Elastic {isFarm ? 'Farms' : 'Pools'} (Legacy)</span>. If you wish to
      participate in our {isFarm ? 'farms' : 'pools'}, check out our new and audited{' '}
      <Link to={isFarm ? '/farms' : '/pools'}>Elastic {isFarm ? 'Farms' : 'Pools'}</Link>.
    </Trans>
  </div>
)

const WarningNotice = () => (
  <div className="rounded-3xl border-0 bg-warning-30 px-5 py-3 text-sm leading-normal text-text">
    <Trans>
      Due to a{' '}
      <ExternalLink href="https://twitter.com/KyberNetwork/status/1647920799557505028?t=3W5CxZULDimB9AgGKFHQ2w&s=19">
        <span className="text-warning">potential issue</span>
      </ExternalLink>{' '}
      with our legacy Elastic protocol, we recommend that all liquidity providers withdraw their liquidity from Elastic
      Pools (Legacy). We have fixed all the issues and deployed the new and audited{' '}
      <Link to="/pools">{t`Elastic Pools`}</Link> where you can add liquidity normally instead.
    </Trans>
  </div>
)

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
        <div className="mt-6 flex flex-col">
          <WarningNotice />
          <AllPositionLegacy positions={[...allPositions, ...farmPositions]} />
        </div>
      )}
    </>
  )
}
