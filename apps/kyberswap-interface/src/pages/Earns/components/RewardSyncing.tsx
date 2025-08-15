import { t } from '@lingui/macro'

import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

const RewardSyncing = () => (
  <PositionSkeleton
    width={105}
    height={24}
    tooltip={t`Data is still syncing — takes up to 5 minutes.`}
    tooltipWidth={195}
    text="Syncing..."
  />
)

export default RewardSyncing
