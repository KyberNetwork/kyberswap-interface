import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { CustomInput, CustomOption } from 'pages/Earns/components/SmartExit/styles'
import { FeeYieldCondition, SelectedMetric } from 'pages/Earns/types'

export default function FeeYieldInput({
  metric,
  setMetric,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
}) {
  const feeYieldCondition = metric.condition as FeeYieldCondition

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
        <Text>
          <Trans>Exit when fee yield ≥</Trans>
        </Text>
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
      </Flex>
      <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
        {[5, 10, 15, 20].map(item => {
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
