import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

import { MoneyBag } from './Icons'
import { MouseoverTooltip } from './Tooltip'

const FarmAvailableTag = styled.div`
  border-radius: 999px;
  padding: 4px 8px;
  height: 20px;
  background: ${({ theme }) => transparentize(0.7, theme.primary)};
  color: ${({ theme }) => theme.primary};
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`

export const FarmTag = ({ address, noTooltip }: { address?: string; noTooltip?: boolean }) => {
  const { networkInfo } = useActiveWeb3React()

  const tag = (
    <FarmAvailableTag>
      <MoneyBag size={12} />
      <Trans>Farming</Trans>
    </FarmAvailableTag>
  )

  if (noTooltip) return tag

  return (
    <MouseoverTooltip
      text={
        <Text>
          <Trans>
            Participate in the Elastic farm to earn more rewards. Click{' '}
            <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${address}`}>here</Link>{' '}
            to go to the farm.
          </Trans>
        </Text>
      }
    >
      {tag}
    </MouseoverTooltip>
  )
}
