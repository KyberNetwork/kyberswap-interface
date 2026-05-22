import { Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span>
            <Trans>Exit when fee yield</Trans>
          </span>
          <InfoHelper
            text={
              <div className="text-xs leading-4 text-subText">
                <Trans>
                  Based on the amount of fee tokens your position has earned compared with your initial deposited token
                  amounts.
                </Trans>
                <br />
                <Trans>
                  This calculation is <span className="font-semibold text-text">token-based</span>,{' '}
                  <span className="font-semibold text-text">not USD-based</span>, and does not change with price
                  fluctuations.
                </Trans>
                <br />
                <a
                  href="https://docs.kyberswap.com/kyberswap-solutions/smart-exit/feature-capabilities#id-1.-fee-yield-condition"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary no-underline hover:underline"
                >
                  <Trans>Details</Trans>
                </a>
              </div>
            }
            placement="bottom"
            color={theme.text}
            width="315px"
            size={14}
            style={{ marginLeft: 0 }}
          />
          <span> ≥</span>
        </div>
        <InlineHighlightWrapper isHighlighted={isHighlighted}>
          <div className="relative flex flex-1">
            <CustomInput
              value={feeYieldCondition}
              onChange={e => {
                const value = e.target.value
                if (/^\d*\.?\d*$/.test(value)) {
                  const numValue = parseFloat(value)
                  if (value === '' || (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
                    setMetric({ ...metric, condition: value })
                  }
                }
              }}
              placeholder="Fee yield"
            />
            <span className="absolute right-2 top-2">%</span>
          </div>
        </InlineHighlightWrapper>
      </div>
      <div className="flex justify-end gap-1">
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
      </div>
    </>
  )
}
