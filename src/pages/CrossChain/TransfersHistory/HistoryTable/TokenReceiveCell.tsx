import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import Column from 'components/Column'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { CrossChainTransfer } from 'pages/CrossChain/useTransferHistory'

type Props = {
  transfer: CrossChainTransfer
}

const TokenAmount = ({
  amount,
  symbol,
  isReceiveAnyToken,
  logoUrl,
  plus,
}: {
  amount: string
  symbol: string
  isReceiveAnyToken?: boolean
  plus?: boolean
  logoUrl: string
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
      <Logo srcs={[logoUrl]} style={{ width: 16, height: 16, borderRadius: '50%' }} />
      <Text style={{ whiteSpace: 'nowrap' }}>
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

const TokenReceiveCell: React.FC<Props> = ({
  transfer: {
    dstTokenLogoUrl,
    srcTokenLogoUrl,
    shouldCheckAxelarscan,
    srcTokenSymbol,
    dstAmount,
    dstTokenSymbol,
    srcAmount,
  },
}) => {
  return (
    <Column style={{ gap: '4px' }}>
      <TokenAmount
        logoUrl={dstTokenLogoUrl}
        plus
        amount={dstAmount}
        symbol={shouldCheckAxelarscan ? 'axlUSDC' : dstTokenSymbol}
        isReceiveAnyToken={shouldCheckAxelarscan}
      />
      <TokenAmount logoUrl={srcTokenLogoUrl} amount={srcAmount} symbol={srcTokenSymbol} />
    </Column>
  )
}

export default TokenReceiveCell
