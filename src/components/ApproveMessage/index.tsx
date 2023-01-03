import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useToggle } from 'react-use'

import Card from 'components/Card'
import LightBulbEffect from 'components/Icons/LightBulbEffect'
import { RowBetween } from 'components/Row'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink, TYPE } from 'theme/index'
import { getEtherscanLink, shortenAddress } from 'utils/index'

export default function ApproveMessage() {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [showApproveMsgDetails, toggleShowApproveMsgDetails] = useToggle(true)
  const EVMRouterAddress = isEVM(chainId) ? NETWORKS_INFO[chainId].aggregator.routerAddress : ''

  return (
    <Card mb="24px" backgroundColor={rgba(theme.subText, 0.2)} padding="12px">
      <RowBetween alignItems="center" gap="8px">
        <LightBulbEffect color={theme.subText} />
        <TYPE.subHeader>
          {showApproveMsgDetails ? (
            <Trans>
              We have deployed an upgrade router contract at{' '}
              <ExternalLink href={getEtherscanLink(chainId, EVMRouterAddress, 'address')}>
                {shortenAddress(chainId, EVMRouterAddress)}
              </ExternalLink>
              . You may have to approve this contract before you trade your tokens
            </Trans>
          ) : (
            t`We have deployed an upgrade router contract`
          )}
        </TYPE.subHeader>
        {showApproveMsgDetails ? (
          <ChevronUp
            size="16px"
            color={theme.subText}
            style={{ minWidth: '16px', minHeight: '16px' }}
            onClick={toggleShowApproveMsgDetails}
            cursor="pointer"
          />
        ) : (
          <ChevronDown
            size="16px"
            color={theme.subText}
            style={{ minWidth: '16px', minHeight: '16px' }}
            onClick={toggleShowApproveMsgDetails}
            cursor="pointer"
          />
        )}
      </RowBetween>
    </Card>
  )
}
