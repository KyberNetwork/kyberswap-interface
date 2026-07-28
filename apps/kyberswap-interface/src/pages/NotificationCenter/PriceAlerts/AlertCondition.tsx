import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import AlertType from 'pages/NotificationCenter/PriceAlerts/AlertType'
import NetworkInlineDisplay from 'pages/NotificationCenter/PriceAlerts/NetworkInlineDisplay'
import TokenInlineDisplay from 'pages/NotificationCenter/PriceAlerts/TokenInlineDisplay'
import { PriceAlert } from 'pages/NotificationCenter/const'
import { uint256ToFraction } from 'utils/numbers'

export type AlertConditionData = Pick<
  PriceAlert,
  | 'tokenInSymbol'
  | 'tokenInLogoURL'
  | 'tokenInAmount'
  | 'tokenOutSymbol'
  | 'tokenOutLogoURL'
  | 'type'
  | 'threshold'
  | 'chainId'
> &
  Partial<Pick<PriceAlert, 'tokenInDecimals'>>

type Props = {
  alertData: AlertConditionData
  shouldIncludePrefix: boolean
}
const AlertCondition: React.FC<Props> = ({ alertData, shouldIncludePrefix }) => {
  const rawChainId = alertData.chainId
  const chainId = Number(rawChainId) as ChainId

  const calculatedAmount = alertData.tokenInDecimals
    ? uint256ToFraction(alertData.tokenInAmount, alertData.tokenInDecimals)?.toSignificant(6)
    : alertData.tokenInAmount

  return (
    <div
      className="flex flex-wrap items-center text-sm leading-5 text-subText"
      style={{ flex: '1 1 fit-content', gap: '4px 6px' }}
    >
      {shouldIncludePrefix && <Trans>Alert when</Trans>}
      <TokenInlineDisplay
        symbol={alertData.tokenInSymbol}
        logoUrl={alertData.tokenInLogoURL}
        amount={calculatedAmount}
      />
      <Trans>to</Trans>
      <TokenInlineDisplay symbol={alertData.tokenOutSymbol} logoUrl={alertData.tokenOutLogoURL} />
      <Trans>on</Trans>
      <NetworkInlineDisplay chainId={chainId} />
      <Trans>goes</Trans> <AlertType type={alertData.type} />
      <TokenInlineDisplay
        symbol={alertData.tokenOutSymbol}
        amount={alertData.threshold}
        logoUrl={alertData.tokenOutLogoURL}
      />
    </div>
  )
}

export default AlertCondition
