import { t } from '@lingui/macro'
import { VaultApiDetailItem } from 'services/vault'

import TokenLogo from 'components/TokenLogo'
import { toDisplaySymbol } from 'pages/Earns/utils/vault'
import { cn } from 'utils/cn'

/**
 * Names the vault a modal is acting on. The deposit and withdraw modals can be opened from a card
 * anywhere in Earn, so they cannot rely on a page header to say which vault is on screen.
 */
const VaultIdentityRow = ({ vault, className }: { vault: VaultApiDetailItem; className?: string }) => (
  <div className={cn('flex w-full items-center gap-2', className)}>
    <span className="relative flex shrink-0 items-center">
      <TokenLogo src={vault.underlyingToken?.logo} alt={vault.underlyingToken?.symbol} size={20} />
      {vault.chain?.logo ? (
        <TokenLogo
          src={vault.chain.logo}
          alt={vault.chain.name}
          size={10}
          className="absolute -bottom-0.5 -right-1 rounded"
        />
      ) : null}
    </span>
    <span className="text-base leading-6 text-white">
      {toDisplaySymbol(vault.baseToken, vault.underlyingToken)} <span className="text-subText">{t`Yield`}</span>
    </span>
    {vault.provider?.name ? (
      <span className="flex items-center gap-1 rounded-2xl bg-white-08 px-2 py-0.5 text-xs leading-4 text-subText">
        {vault.provider.logo ? <TokenLogo src={vault.provider.logo} alt={vault.provider.name} size={14} /> : null}
        {vault.provider.name}
      </span>
    ) : null}
  </div>
)

export default VaultIdentityRow
