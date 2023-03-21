import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'

import useTheme from 'hooks/useTheme'
import AlertType from 'pages/NotificationCenter/PriceAlerts/AlertType'
import NetworkInlineDisplay from 'pages/NotificationCenter/PriceAlerts/NetworkInlineDisplay'
import TokenInlineDisplay from 'pages/NotificationCenter/PriceAlerts/TokenInlineDisplay'
import { PriceAlert } from 'pages/NotificationCenter/const'
import { uint256ToFraction } from 'utils/numbers'

type Props = {
  alert: PriceAlert
}
const AlertCondition: React.FC<Props> = ({ alert }) => {
  const theme = useTheme()

  return (
    <Flex
      sx={{
        flex: '1 1 fit-content',
        alignItems: 'center',
        fontSize: '14px',
        color: theme.subText,
        columnGap: '6px',
        flexWrap: 'wrap',
        lineHeight: '20px',
      }}
    >
      <Trans>Alert when the price of</Trans>
      <TokenInlineDisplay
        symbol={alert.tokenInSymbol}
        logoUrl={alert.tokenInLogoURL}
        amount={uint256ToFraction(alert.tokenInAmount, alert.tokenInDecimals)?.toSignificant(6)}
      />
      <Trans>to</Trans>
      <TokenInlineDisplay symbol={alert.tokenOutSymbol} logoUrl={alert.tokenOutLogoURL} />
      <Trans>on</Trans>
      <NetworkInlineDisplay chainId={ChainId.AVAXMAINNET} />
      <Trans>goes</Trans> <AlertType type={alert.type} />
      <TokenInlineDisplay symbol={alert.tokenOutSymbol} amount={alert.threshold} />
    </Flex>
  )
}

export default AlertCondition
