import { t } from '@lingui/macro'
import { Fragment } from 'react'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'
import TokenLogo from 'components/TokenLogo'

export type VaultRouteLeg = {
  amount: string
  symbol: string
  logo?: string
}

export type VaultRouteSummary = {
  /** Shown before the first leg, e.g. where a withdrawal is coming from. */
  leading?: { label: string; logo?: string }
  /** Every token the route spends. Each keeps its own mark; the worth below is their total. */
  from: VaultRouteLeg[]
  fromUsd?: string
  to: VaultRouteLeg
  toUsd?: string
}

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-white-08 bg-background px-3 py-2">
    {children}
  </div>
)

const TokenAmount = ({ leg }: { leg: VaultRouteLeg }) => (
  <span className="flex items-center gap-1.5 text-sm leading-5 text-text">
    {leg.logo ? <TokenLogo src={leg.logo} alt={leg.symbol} size={16} /> : null}
    {leg.amount} {leg.symbol}
  </span>
)

const Usd = ({ value }: { value?: string }) =>
  value ? <span className="text-xs leading-4 text-subText">~ {value}</span> : null

const Connector = () => <div className="h-px min-w-6 flex-1 bg-white-08" />

/**
 * The path a zap takes, above the vault's charts so the swap is visible before confirming. Every
 * leg the route quotes runs straight into the vault's own token, so they share one box rather than
 * a row each — but each keeps its own amount and mark, since they are separate tokens being spent.
 */
const ZapRouteStrip = ({ summary }: { summary: VaultRouteSummary }) => {
  if (!summary.from.length) return null

  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto">
      {summary.leading ? (
        <>
          <Box>
            <span className="text-xs leading-4 text-subText">{t`Withdraw from`}</span>
            <span className="flex items-center gap-1.5 text-sm leading-5 text-text">
              {summary.leading.logo ? (
                <TokenLogo src={summary.leading.logo} alt={summary.leading.label} size={16} />
              ) : null}
              {summary.leading.label}
            </span>
          </Box>
          <Connector />
        </>
      ) : null}

      <Box>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {summary.from.map((leg, index) => (
            <Fragment key={`${leg.symbol}-${index}`}>
              {index > 0 ? <span className="text-sm leading-5 text-subText">+</span> : null}
              <TokenAmount leg={leg} />
            </Fragment>
          ))}
        </span>
        <Usd value={summary.fromUsd} />
      </Box>

      <Connector />

      <Box>
        <span className="text-xs leading-4 text-subText">{t`Swap via`}</span>
        <span className="flex items-center gap-1.5 text-sm leading-5 text-text">
          <KyberLogo width={16} height={16} />
          {t`Kyber Zap`}
        </span>
      </Box>

      <Connector />

      <Box>
        <TokenAmount leg={summary.to} />
        <Usd value={summary.toUsd} />
      </Box>
    </div>
  )
}

export default ZapRouteStrip
