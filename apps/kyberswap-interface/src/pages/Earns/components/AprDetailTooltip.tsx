import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { PropsWithChildren } from 'react'
import { Flex, Text } from 'rebass'

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
        <Flex sx={{ flexDirection: 'column', gap: '2px' }}>
          {feeApr !== undefined && (
            <Text>
              {t`LP Fee APR`}: {formatAprNumber(feeApr)}%
            </Text>
          )}
          {egApr !== undefined && (
            <Text>
              {t`FairFlow EG Reward`}: {formatAprNumber(egApr)}%
            </Text>
          )}
          {!!lmApr && (
            <Text>
              {t`LM Reward`}: {formatAprNumber(lmApr)}%
            </Text>
          )}
          {!!merklApr && (
            <Text>
              {t`Merkl Bonus`}: {formatAprNumber(merklApr)}%
            </Text>
          )}
        </Flex>
      }
    >
      {children}
    </MouseoverTooltipDesktopOnly>
  )
}
