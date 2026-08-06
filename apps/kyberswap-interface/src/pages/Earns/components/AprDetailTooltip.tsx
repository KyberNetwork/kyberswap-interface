import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { PropsWithChildren } from 'react'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import EgCalculating from 'pages/Earns/components/EgCalculating'

type Props = PropsWithChildren<{
  feeApr?: number
  egApr?: number
  lmApr?: number
  merklApr?: number
  egCalculating?: boolean
}>

export default function AprDetailTooltip({ feeApr, egApr, lmApr, merklApr, egCalculating, children }: Props) {
  return (
    <MouseoverTooltipDesktopOnly
      placement="top"
      width="fit-content"
      text={
        <div className="flex flex-col gap-[2px]">
          {feeApr !== undefined && (
            <span>
              {t`LP Fee APR`}: {formatAprNumber(feeApr)}%
            </span>
          )}
          {(egCalculating || egApr !== undefined) && (
            <span>
              {t`FairFlow EG Rewards`}: {egCalculating ? <EgCalculating /> : `${formatAprNumber(egApr ?? 0)}%`}
            </span>
          )}
          {!!lmApr && (
            <span>
              {t`LM Rewards`}: {formatAprNumber(lmApr)}%
            </span>
          )}
          {!!merklApr && (
            <span>
              {t`Merkl Bonus`}: {formatAprNumber(merklApr)}%
            </span>
          )}
        </div>
      }
    >
      {children}
    </MouseoverTooltipDesktopOnly>
  )
}
