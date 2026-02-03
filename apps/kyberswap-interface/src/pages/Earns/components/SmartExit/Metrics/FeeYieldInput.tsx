import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { useTheme } from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { InlineHighlightWrapper } from 'pages/Earns/components/SmartExit/GuidedHighlight'
import { FEE_YIELD_PRESETS } from 'pages/Earns/components/SmartExit/constants'
import { CustomInput, CustomOption } from 'pages/Earns/components/SmartExit/styles'
import { getFeeYieldCondition } from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { SelectedMetric } from 'pages/Earns/types'

export default function FeeYieldInput({
  metric,
  setMetric,
  isHighlighted = false,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  isHighlighted?: boolean
}) {
  const feeYieldCondition = getFeeYieldCondition(metric) || ''
  const theme = useTheme()

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <Text>
            <Trans>Exit when fee yield</Trans>
          </Text>
          <InfoHelper
            text={
              <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                <Trans>
                  Based on the amount of fee tokens your position has earned compared with your initial deposited token
                  amounts.
                </Trans>
                <br />
                <Trans>
                  This calculation is{' '}
                  <Text as="span" fontWeight={600} color={theme.text}>
                    token-based
                  </Text>
                  ,{' '}
                  <Text as="span" fontWeight={600} color={theme.text}>
                    not USD-based
                  </Text>
                  , and does not change with price fluctuations.
                </Trans>
                <br />
                <Text
                  as="a"
                  href="https://docs.kyberswap.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  color={theme.primary}
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  <Trans>Details</Trans>
                </Text>
              </Text>
            }
            placement="bottom"
            color={theme.text}
            width="315px"
            size={14}
            style={{ marginLeft: 0 }}
          />
          <Text> ≥</Text>
        </Flex>
        <InlineHighlightWrapper isHighlighted={isHighlighted}>
          <Flex sx={{ position: 'relative' }} flex={1}>
            <CustomInput
              value={feeYieldCondition}
              onChange={e => {
                const value = e.target.value
                // Only allow numbers and decimal point
                if (/^\d*\.?\d*$/.test(value)) {
                  const numValue = parseFloat(value)
                  // Allow 0-100%
                  if (value === '' || (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
                    setMetric({ ...metric, condition: value })
                  }
                }
              }}
              placeholder="Fee yield"
            />
            <Text
              sx={{
                top: '8px',
                right: '8px',
                position: 'absolute',
              }}
            >
              %
            </Text>
          </Flex>
        </InlineHighlightWrapper>
      </Flex>
      <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
        {FEE_YIELD_PRESETS.map(item => {
          const isSelected = metric.condition === item.toString()

          return (
            <CustomOption
              key={item}
              onClick={() => setMetric({ ...metric, condition: item.toString() })}
              isSelected={isSelected}
            >
              {item}%
            </CustomOption>
          )
        })}
      </Flex>
    </>
  )
}
