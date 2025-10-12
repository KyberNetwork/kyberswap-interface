import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'

export default function AprDetailTooltip({
  feeApr,
  egApr,
  lmApr,
  children,
}: {
  feeApr: number
  egApr: number
  lmApr: number
  children: React.ReactNode
}) {
  return (
    <MouseoverTooltipDesktopOnly
      placement="top"
      width="fit-content"
      text={
        <Flex sx={{ flexDirection: 'column', gap: '2px' }}>
          <Text>
            {t`LP Fees`}: {formatAprNumber(feeApr)}%
          </Text>
          <Text>
            {t`EG Sharing Reward`}: {formatAprNumber(egApr)}%
          </Text>
          {lmApr > 0 && (
            <Text>
              {t`LM Reward`}: {formatAprNumber(lmApr)}%
            </Text>
          )}
        </Flex>
      }
    >
      {children}
    </MouseoverTooltipDesktopOnly>
  )
}
