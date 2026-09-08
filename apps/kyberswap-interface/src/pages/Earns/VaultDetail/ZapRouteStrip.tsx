import { t } from '@lingui/macro'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'
import TokenLogo from 'components/TokenLogo'

export type VaultRouteLeg = {
  amount: string
  symbol: string
  usd?: string
  logo?: string
}

export type VaultRouteSummary = {
  /** Shown before the first leg, e.g. where a withdrawal is coming from. */
  leading?: { label: string; logo?: string }
  from: VaultRouteLeg
  to: VaultRouteLeg
}

const Leg = ({ leg }: { leg: VaultRouteLeg }) => (
  <div className="flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-white-08 bg-background px-3 py-2">
    <span className="flex items-center gap-1.5 text-sm leading-5 text-text">
      {leg.logo ? <TokenLogo src={leg.logo} alt={leg.symbol} size={16} /> : null}
      {leg.amount} {leg.symbol}
    </span>
    {leg.usd ? <span className="text-xs leading-4 text-subText">~ {leg.usd}</span> : null}
  </div>
)

const Connector = () => <div className="h-px min-w-6 flex-1 bg-white-08" />

/** The path a zap takes, shown above the vault's charts so the swap is visible before confirming. */
const ZapRouteStrip = ({ summary }: { summary: VaultRouteSummary }) => (
  <div className="flex w-full items-center gap-1 overflow-x-auto">
    {summary.leading ? (
      <>
        <div className="flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-white-08 bg-background px-3 py-2">
          <span className="text-xs leading-4 text-subText">{t`Withdraw from`}</span>
          <span className="flex items-center gap-1.5 text-sm leading-5 text-text">
            {summary.leading.logo ? (
              <TokenLogo src={summary.leading.logo} alt={summary.leading.label} size={16} />
            ) : null}
            {summary.leading.label}
          </span>
        </div>
        <Connector />
      </>
    ) : null}

    <Leg leg={summary.from} />
    <Connector />

    <div className="flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-white-08 bg-background px-3 py-2">
      <span className="text-xs leading-4 text-subText">{t`Swap via`}</span>
      <span className="flex items-center gap-1.5 text-sm leading-5 text-text">
        <KyberLogo width={16} height={16} />
        {t`Kyber Zap`}
      </span>
    </div>

    <Connector />
    <Leg leg={summary.to} />
  </div>
)

export default ZapRouteStrip
