import { Trans } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetTokenListQuery } from 'services/ksSetting'

import { WarningCard } from 'components/Card'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

export default function DisclaimerERC20({ href, token0, token1 }: { href?: string; token0: string; token1: string }) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { data, isLoading } = useGetTokenListQuery(
    {
      chainId,
      addresses: `${token0},${token1}`,
    },
    {
      skip: !token0 || !token1,
    },
  )

  const hide = data?.data?.tokens?.[0]?.isStandardERC20 && data?.data?.tokens?.[1]?.isStandardERC20

  if (!hide && !isLoading)
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
  return null
}
