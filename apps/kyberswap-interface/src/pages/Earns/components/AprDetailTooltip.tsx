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
  const lines = [
    {
      label: t`LP Fees`,
      value: feeApr,
    },

    {
      label: t`EG Sharing Reward`,
      value: egApr,
    },
    {
      label: t`LM Reward`,
      value: lmApr,
    },
  ].filter(line => line.value > 0)

  return (
    <MouseoverTooltipDesktopOnly
      placement="top"
      width="fit-content"
      text={
        <Flex sx={{ flexDirection: 'column', gap: '2px' }}>
          {lines.map(line => (
            <Text key={line.label}>
              {line.label}: {formatAprNumber(line.value)}%
            </Text>
          ))}
        </Flex>
      }
    >
      {children}
    </MouseoverTooltipDesktopOnly>
  )
}
