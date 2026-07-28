import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'

import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { cn } from 'utils/cn'

export const FarmTag = ({
  address,
  noTooltip,
  noText,
  chainId,
}: {
  address?: string
  noTooltip?: boolean
  noText?: boolean
  chainId?: ChainId
}) => {
  const { chainId: currentChainId } = useActiveWeb3React()

  const tag = (
    <div
      className={cn(
        'flex h-5 items-center gap-1 rounded-full bg-primary-30 text-xs font-medium text-primary',
        noText ? 'px-1 py-0.5' : 'px-2 py-1',
      )}
    >
      <MoneyBag size={12} />
      {!noText && <Trans>Farming</Trans>}
    </div>
  )

  if (noTooltip) return tag

  return (
    <MouseoverTooltip
      text={
        <span>
          <Trans>
            Participate in the Elastic farm to earn more rewards. Click{' '}
            <Link
              to={`${LEGACY_POOL_APP_PATHS.FARMS}/${
                NETWORKS_INFO[chainId || currentChainId].route
              }?tab=elastic&type=active&search=${address}`}
            >
              here
            </Link>{' '}
            to go to the farm.
          </Trans>
        </span>
      }
    >
      {tag}
    </MouseoverTooltip>
  )
}
