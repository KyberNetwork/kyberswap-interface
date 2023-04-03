import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

import { MoneyBag } from './Icons'
import { MouseoverTooltip } from './Tooltip'

const FarmAvailableTag = styled.div<{ version: 'v1' | 'v2' }>`
  border-radius: 999px;
  padding: 4px 8px;
  height: 20px;
  background: ${({ theme, version }) =>
    version === 'v1' ? transparentize(0.7, theme.apr) : transparentize(0.7, theme.primary)};
  color: ${({ theme, version }) => (version === 'v1' ? theme.apr : theme.primary)};
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`

export const FarmTag = ({
  version,
  address,
  noTooltip,
}: {
  version: 'v1' | 'v2'
  address?: string
  noTooltip?: boolean
}) => {
  const { networkInfo } = useActiveWeb3React()
  if (noTooltip)
    return (
      <FarmAvailableTag version={version}>
        <MoneyBag size={12} />
        {version === 'v1' ? 'V1' : 'V2'}
      </FarmAvailableTag>
    )

  return (
    <MouseoverTooltip
      text={
        <Text>
          <Trans>
            Participate in the Elastic {version} farm to earn more rewards. Click{' '}
            <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${address}`}>here</Link>{' '}
            to go to the farm.
          </Trans>
        </Text>
      }
    >
      <FarmAvailableTag version={version}>
        <MoneyBag size={12} />
        {version === 'v1' ? 'V1' : 'V2'}
      </FarmAvailableTag>
    </MouseoverTooltip>
  )
}
