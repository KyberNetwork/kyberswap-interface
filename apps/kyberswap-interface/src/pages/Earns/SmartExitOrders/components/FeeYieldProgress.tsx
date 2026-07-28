import { formatDisplayNumber } from 'utils/numbers'

type FeeYieldProgressProps = {
  targetYield: number
  currentYield: number | undefined
}

const FeeYieldProgress = ({ targetYield, currentYield }: FeeYieldProgressProps) => {
  const rawProgress =
    currentYield !== undefined && isFinite(currentYield) && targetYield > 0 ? (currentYield / targetYield) * 100 : 0
  const progress = isFinite(rawProgress) ? rawProgress : 0

  return (
    <div className="flex w-full flex-col gap-[6.5px]">
      <span className="text-right text-xs text-subText">
        The <span className="text-text">fee yield ≥ {formatDisplayNumber(targetYield, { significantDigits: 4 })}%</span>
      </span>
      <span className="mt-[3px] text-right text-xs text-subText">
        <span className="text-text">{formatDisplayNumber(currentYield, { significantDigits: 4 })}%</span> /{' '}
        {formatDisplayNumber(targetYield, { significantDigits: 4 })}%
      </span>
      <div className="relative h-1 w-full overflow-hidden rounded bg-border">
        <div
          className="h-full rounded bg-primary transition-[width] duration-300 [transition-timing-function:ease]"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default FeeYieldProgress
