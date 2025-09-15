import { t } from '@lingui/macro'

import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

const RewardSyncing = ({ width, height }: { width: number; height: number }) => (
  <PositionSkeleton
    width={width}
    height={height}
    tooltip={t`Data is still syncing — takes up to 5 minutes.`}
    tooltipWidth={195}
    text="Syncing..."
  />
)

export default RewardSyncing
