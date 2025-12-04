import { Trans } from '@lingui/macro'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { CustomInput } from 'pages/Earns/components/SmartExit/styles'
import { FeeYieldCondition, SelectedMetric } from 'pages/Earns/types'

export default function FeeYieldInput({
  metric,
  setMetric,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
}) {
  const theme = useTheme()
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
                // Limit to 1-100%
                if (value === '' || numValue > 0) {
                  setMetric({ ...metric, condition: value })
                }
              }
            }}
            placeholder="0"
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
      <Flex justifyContent="flex-end" sx={{ gap: '4px' }} mt="8px">
        {[5, 10, 15, 20].map(item => {
          const isSelected = metric.condition === item.toString()

          return (
            <Box
              key={item}
              onClick={() => setMetric({ ...metric, condition: item.toString() })}
              sx={{
                borderRadius: '999px',
                border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                backgroundColor: isSelected ? theme.primary + '20' : 'transparent',
                padding: '4px 12px',
                color: isSelected ? theme.primary : theme.subText,
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.primary + '10',
                },
              }}
            >
              {item}%
            </Box>
          )
        })}
      </Flex>
    </>
  )
}
