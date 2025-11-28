import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { PropsWithChildren } from 'react'
import { Flex, Text } from 'rebass'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'

type Props = PropsWithChildren<{
  feeApr?: number
  egApr?: number
  lmApr?: number
  uniApr?: number
}>

export default function AprDetailTooltip({ feeApr, egApr, lmApr, uniApr, children }: Props) {
  return (
    <MouseoverTooltipDesktopOnly
      placement="top"
      width="fit-content"
      text={
        <Flex sx={{ flexDirection: 'column', gap: '2px' }}>
          {feeApr !== undefined && (
            <Text>
              {t`LP Fees`}: {formatAprNumber(feeApr)}%
            </Text>
          )}
          {egApr !== undefined && (
            <Text>
              {t`EG Sharing Reward`}: {formatAprNumber(egApr)}%
            </Text>
          )}
          {!!lmApr && (
            <Text>
              {t`LM Reward`}: {formatAprNumber(lmApr)}%
            </Text>
          )}
          {!!uniApr && (
            <Text>
              {t`Uniswap Bonus`}: {formatAprNumber(uniApr)}%
            </Text>
          )}
        </Flex>
      }
    >
      {children}
    </MouseoverTooltipDesktopOnly>
  )
}
