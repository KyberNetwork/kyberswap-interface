import { Trans, t } from '@lingui/macro'
import { ArrowUpRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

export default function CrossChainLink({ isBridge }: { isBridge?: boolean }) {
  const navigate = useNavigate()
  const theme = useTheme()
  return null
  return (
    <Flex fontSize={'12px'} color={theme.subText} justifyContent={'center'} style={{ gap: '3px', fontWeight: '500' }}>
      {isBridge ? <Trans>Looking to</Trans> : <Trans>Looking to make a</Trans>}
      <MouseoverTooltip
        placement="top"
        text={
          isBridge
            ? t`Use the bridge when sending the same token between chains without swapping. Not every token may be available for bridging`
            : t`Use cross-chain swaps to swap between different tokens from one chain to another`
        }
      >
        <Flex
          alignItems={'center'}
          style={{ cursor: 'pointer' }}
          color={theme.primary}
          onClick={() => navigate(isBridge ? APP_PATHS.BRIDGE : APP_PATHS.CROSS_CHAIN)}
        >
          {isBridge ? 'Bridge' : 'Cross-Chain Swaps'}
          <ArrowUpRight size={12} color={theme.primary} />
        </Flex>
      </MouseoverTooltip>

      <Trans>instead?</Trans>
    </Flex>
  )
}
