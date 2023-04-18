import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import Column from 'components/Column'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'

type Props = {
  transfer: MultichainTransfer
}

const TokenAmount = ({
  amount,
  symbol,
  isReceiveAnyToken,
  plus,
}: {
  amount: string
  symbol: string
  isReceiveAnyToken?: boolean
  plus?: boolean
}) => {
  const theme = useTheme()
  return (
    <Flex
      alignItems={'center'}
      fontSize={12}
      fontWeight={'500'}
      style={{ gap: '4px' }}
      color={isReceiveAnyToken ? theme.warning : plus ? theme.primary : theme.subText}
    >
      <Logo srcs={['']} style={{ width: 16, height: 16, borderRadius: '50%' }} />
      <Text>
        {plus ? '+' : '-'} {formatAmountBridge(amount)}
      </Text>{' '}
      <span>{symbol}</span>{' '}
      {isReceiveAnyToken && (
        <MouseoverTooltip
          text={
            <Text>
              <Trans>
                The price changed during your transaction (and exceeded your max slippage), so you have received axlUSDC
                on Avalanche instead. Check your wallet
              </Trans>
            </Text>
          }
          placement="top"
        >
          <Info size={16} />
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

const TokenReceiveCell: React.FC<Props> = ({ transfer }) => {
  return (
    <Column style={{ gap: '4px' }}>
      <TokenAmount
        plus
        amount={transfer.dstAmount}
        symbol={transfer.dstTokenSymbol}
        isReceiveAnyToken={transfer.isReceiveAnyToken}
      />
      <TokenAmount amount={transfer.dstAmount} symbol={transfer.dstTokenSymbol} />
    </Column>
  )
}

export default TokenReceiveCell
