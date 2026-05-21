import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { cn } from 'utils/cn'

interface ProgressCirclesProps {
  steps: boolean[]
  disabled?: boolean
}

const circleClasses = (confirmed?: boolean, disabled?: boolean) =>
  cn(
    'flex min-h-5 min-w-5 items-center justify-center rounded-full text-xs leading-[8px]',
    disabled ? 'bg-buttonGray text-border' : confirmed ? 'bg-green1 text-textReverse' : 'bg-primary text-textReverse',
  )

const Connector = ({ prevConfirmed, disabled }: { prevConfirmed?: boolean; disabled?: boolean }) => {
  // transparentize(0.5, X) = X at 50% alpha. green1-50 and primary-50 tokens.
  const fromColor = disabled ? 'var(--ks-bg4)' : prevConfirmed ? 'var(--ks-green1-50)' : 'var(--ks-primary-50)'
  const toColor = disabled ? 'var(--ks-bg4)' : prevConfirmed ? 'var(--ks-primary)' : 'var(--ks-bg4)'
  return (
    <div
      className="h-0.5 w-full opacity-60"
      style={{ background: `linear-gradient(90deg, ${fromColor} 0%, ${toColor} 80%)` }}
    />
  )
}

/**
 * Based on array of steps, create a step counter of circles.
 * A circle can be enabled, disabled, or confirmed. States are derived
 * from previous step.
 */
export default function ProgressCircles({ steps, disabled = false, ...rest }: ProgressCirclesProps) {
  return (
    <AutoColumn justify="center" {...rest}>
      <RowBetween className="w-1/2">
        {steps.map((step, i) => {
          const stepDisabled = disabled || (!steps[i - 1] && i !== 0)
          return (
            <div key={i} className="flex w-[calc(100%-20px)] items-center">
              <div className={circleClasses(step, stepDisabled)}>{step ? '✓' : i + 1}</div>
              <Connector prevConfirmed={step} disabled={disabled} />
            </div>
          )
        })}
        <div className={circleClasses(false, disabled || !steps[steps.length - 1])}>{steps.length + 1}</div>
      </RowBetween>
    </AutoColumn>
  )
}
