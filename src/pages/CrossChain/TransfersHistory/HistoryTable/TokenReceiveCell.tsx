import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import Column from 'components/Column'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { CrossChainTransfer } from 'pages/CrossChain/useTransferHistory'
import { ExternalLink } from 'theme'

type Props = {
  transfer: CrossChainTransfer
}

const TokenAmount = ({
  amount,
  symbol,
  isReceiveAnyToken,
  logoUrl,
  plus,
  dstChainId,
}: {
  amount: string
  symbol: string
  isReceiveAnyToken?: boolean
  plus?: boolean
  logoUrl: string
  dstChainId: ChainId
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
          width="320px"
          text={
            <Text>
              <Trans>
                Due to changing market conditions, Squid{' '}
                <ExternalLink href="https://docs.squidrouter.com/architecture/fallback-behaviour-on-failed-transactions">
                  was unable to guarantee the estimated output amount
                </ExternalLink>
                . As the configured{' '}
                <ExternalLink
                  href={'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'}
                >
                  slippage
                </ExternalLink>{' '}
                was exceeded, you have received axlUSDC on {NETWORKS_INFO[dstChainId].name}. Please check your wallet
                for{' '}
                <ExternalLink href={'https://docs.axelar.dev/dev/reference/mainnet-contract-addresses#assets'}>
                  axlUSDC
                </ExternalLink>
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
    dstChainId,
  },
}) => {
  const chainIdOut = Number(dstChainId) as ChainId
  return (
    <Column style={{ gap: '4px' }}>
      <TokenAmount
        logoUrl={dstTokenLogoUrl}
        plus
        amount={dstAmount}
        symbol={shouldCheckAxelarscan ? 'axlUSDC' : dstTokenSymbol}
        isReceiveAnyToken={shouldCheckAxelarscan}
        dstChainId={chainIdOut}
      />
      <TokenAmount logoUrl={srcTokenLogoUrl} amount={srcAmount} symbol={srcTokenSymbol} dstChainId={chainIdOut} />
    </Column>
  )
}

export default TokenReceiveCell
