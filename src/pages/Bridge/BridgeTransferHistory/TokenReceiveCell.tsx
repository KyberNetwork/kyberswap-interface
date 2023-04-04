import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import { MouseoverTooltip } from 'components/Tooltip'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { ExternalLink } from 'theme'

type Props = {
  transfer: MultichainTransfer
}

const TokenReceiveCell: React.FC<Props> = ({ transfer }) => {
  const theme = useTheme()

  const tooltipText = (
    <Text>
      You have received some anyToken from Multichain. You can exchange your anyToken to {transfer.dstTokenSymbol} at{' '}
      Multichain, when the pool has sufficient liquidity.{' '}
      <ExternalLink href="https://app.multichain.org/#/pool">See here ↗</ExternalLink>
    </Text>
  )
  return (
    <Flex
      sx={{
        alignItems: 'center',
        flexWrap: 'nowrap',
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        gap: '4px',
        color: transfer.isReceiveAnyToken ? theme.warning : undefined,
      }}
    >
      {formatAmountBridge(transfer.dstAmount)} {transfer.dstTokenSymbol}{' '}
      {transfer.isReceiveAnyToken && (
        <MouseoverTooltip text={tooltipText} placement="top">
          <Info size={16} />
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

export default TokenReceiveCell
