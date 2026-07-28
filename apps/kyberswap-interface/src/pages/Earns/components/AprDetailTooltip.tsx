import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { PropsWithChildren } from 'react'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'

type Props = PropsWithChildren<{
  feeApr?: number
  egApr?: number
  lmApr?: number
  merklApr?: number
}>

export default function AprDetailTooltip({ feeApr, egApr, lmApr, merklApr, children }: Props) {
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
          {egApr !== undefined && (
            <span>
              {t`FairFlow EG Rewards`}: {formatAprNumber(egApr)}%
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
