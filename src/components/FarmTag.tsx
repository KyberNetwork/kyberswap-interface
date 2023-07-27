import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

import { MoneyBag } from './Icons'
import { MouseoverTooltip } from './Tooltip'

const FarmAvailableTag = styled.div<{ padding: string }>`
  border-radius: 999px;
  padding: ${({ padding }) => padding};
  height: 20px;
  background: ${({ theme }) => transparentize(0.7, theme.primary)};
  color: ${({ theme }) => theme.primary};
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`

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
    <FarmAvailableTag padding={noText ? '2px 4px' : '4px 8px'}>
      <MoneyBag size={12} />
      {!noText && <Trans>Farming</Trans>}
    </FarmAvailableTag>
  )

  if (noTooltip) return tag

  return (
    <MouseoverTooltip
      text={
        <Text>
          <Trans>
            Participate in the Elastic farm to earn more rewards. Click{' '}
            <Link
              to={`${APP_PATHS.FARMS}/${
                NETWORKS_INFO[chainId || currentChainId].route
              }?tab=elastic&type=active&search=${address}`}
            >
              here
            </Link>{' '}
            to go to the farm.
          </Trans>
        </Text>
      }
    >
      {tag}
    </MouseoverTooltip>
  )
}
