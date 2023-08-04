import { Trans } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'

import { WarningCard } from 'components/Card'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

export default function DisclaimerERC20({ href }: { href?: string }) {
  const theme = useTheme()
  return (
    <WarningCard padding="10px 16px">
      <Flex alignItems="center" sx={{ gap: '12px' }} lineHeight={1.5}>
        <AlertTriangle stroke={theme.warning} size="16px" />
        <Text flex={1} fontSize={12}>
          <Trans>
            Disclaimer: KyberSwap is a permissionless protocol optimized for the standard ERC20 implementation only.
            Please do your own research before you provide liquidity using tokens with unique mechanics (e.g. FOT,
            Rebase, LP tokens, contract deposits, etc.). More info{' '}
            <ExternalLink
              href={
                href ||
                'https://docs.kyberswap.com/liquidity-solutions/kyberswap-elastic/user-guides/elastic-pool-creation#non-standard-tokens'
              }
            >
              here
            </ExternalLink>
          </Trans>
        </Text>
      </Flex>
    </WarningCard>
  )
}
