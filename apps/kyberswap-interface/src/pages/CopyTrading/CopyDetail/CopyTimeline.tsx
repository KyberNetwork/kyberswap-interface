import dayjs from 'dayjs'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

const capitalFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatCapital = (value?: string) =>
  value?.trim() && Number.isFinite(Number(value)) ? capitalFormatter.format(Number(value)) : '—'

const formatTimelineDate = (value?: string) => {
  const date = value ? dayjs(value).locale('en') : undefined
  return date?.isValid() ? date.format('DD MMM, YYYY HH:mm') : '—'
}

const CopyTimeline = ({ run, quoteTokenSymbol }: { run: CopyRunSummary; quoteTokenSymbol?: string }) => {
  const breakdown = run.capitalOutBreakdown

  return (
    <div className="grid grid-cols-[minmax(0,300px)_minmax(16px,1fr)_minmax(0,300px)] items-start gap-x-6 gap-y-4 rounded-2xl bg-buttonBlack p-6 max-sm:grid-cols-[minmax(0,300px)] max-sm:p-4">
      <div className="flex min-h-12 w-full items-center justify-center rounded-xl bg-white-04 px-4 py-3 text-center text-base font-medium text-primary max-sm:row-start-1">
        Started: {formatTimelineDate(run.startedAt)}
      </div>
      <div aria-hidden className="h-0.5 self-center rounded-full bg-gradient-to-r from-primary to-red max-sm:hidden" />
      <div className="flex min-h-12 w-full items-center justify-center rounded-xl bg-white-04 px-4 py-3 text-center text-base font-medium text-red max-sm:row-start-3">
        Stopped: {formatTimelineDate(run.stoppedAt)}
      </div>

      <div className="col-start-1 flex min-w-0 items-baseline gap-2 text-lg max-sm:row-start-2">
        <span className="text-subText">In:</span>
        <span className="break-all font-medium tabular-nums text-text">{formatCapital(run.capitalInUsd)}</span>
      </div>
      <div className="col-start-3 min-w-0 max-sm:col-start-1 max-sm:row-start-4">
        <div className="flex items-baseline justify-between gap-4 text-lg">
          <span className="text-subText">Out:</span>
          <span className="break-all text-right font-medium tabular-nums text-text">
            {formatCapital(run.capitalOutUsd)}
          </span>
        </div>
        {breakdown && (
          <dl className="m-0 grid gap-3 pl-2 pt-2 text-sm">
            {[
              { label: quoteTokenSymbol?.trim() || 'Quote token', value: breakdown.quoteUsd },
              { label: 'Tokens withdrawn', value: breakdown.tokensWithdrawnUsd },
            ].map(({ label, value }, index) => (
              <div key={index} className="relative flex items-baseline justify-between gap-4 pl-4">
                <span
                  aria-hidden
                  className={`absolute -top-3 left-0 w-2 border-b border-l border-subText/30 ${
                    index === 0 ? 'h-[calc(100%+12px)] border-b-0' : 'h-6 rounded-bl-sm'
                  }`}
                />
                {index === 0 && <span aria-hidden className="absolute left-0 top-3 w-2 border-b border-subText/30" />}
                <dt className="text-subText">{label}</dt>
                <dd className="m-0 shrink-0 text-right tabular-nums text-text">{formatCapital(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}

export default CopyTimeline
