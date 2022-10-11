import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { CollapseItem } from 'components/Collapse'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const AmountWarning = ({ title }: { title: string }) => {
  const theme = useTheme()
  return (
    <CollapseItem
      arrowComponent={<DropdownSVG />}
      style={{ background: rgba(theme.warning, 0.25), borderRadius: 16, padding: '14px 20px' }}
      header={
        <Flex color={theme.warning} alignItems="center" style={{ gap: 8 }}>
          <AlertTriangle size={15} />{' '}
          <Text fontWeight={500} fontSize={13}>
            {title}
          </Text>
        </Flex>
      }
    >
      <Text as="p" fontSize={12} lineHeight={'16px'}>
        <Trans>
          There is a chance that during your transfer another high volume transaction utilizes the available liquidity.
          As a result, for the unavailable liquidity, you may receive ‘anyToken’ from Multichain. You can exchange your
          ‘anyToken’ when the Multichain pool has sufficient liquidity.
        </Trans>
      </Text>
      <ExternalLink
        style={{ fontSize: 12 }}
        href="https://multichain.zendesk.com/hc/en-us/articles/4410379722639-Redeem-Remove-Pool-Token-Anyassets-e-g-anyUSDC-anyUSDT-anyDAI-anyETH-anyFTM-etc-into-Native-Token-Tutorial"
      >
        See here ↗
      </ExternalLink>
    </CollapseItem>
  )
}
export default AmountWarning
