import { ChainId } from '@kyberswap/ks-sdk-core'

import EtherFiLogo from 'assets/svg/earn/ic_logo_etherfi.svg'
import { MenuOption } from 'components/DropdownMenu'
import { NETWORKS_INFO } from 'constants/networks'
import { AllChainsOption, AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'

/**
 * Filter options for the vault pages.
 *
 * Spelled out rather than derived from the vault list: deriving them meant fetching the whole list
 * a second time — the page's own copy is filtered, so it cannot say which chains and partners exist
 * once a filter is on.
 *
 * Both "All …" entries send no filter, so a vault the API starts serving on another chain or from
 * another partner still appears in the list; only its dropdown entry waits for a release.
 */
export const VAULT_CHAIN_OPTIONS: MenuOption[] = [
  // The shared option reads "All Chains"; the vault pages have always said "All Networks".
  { ...AllChainsOption, label: 'All Networks' },
  {
    label: NETWORKS_INFO[ChainId.MAINNET].name,
    value: String(ChainId.MAINNET),
    icon: NETWORKS_INFO[ChainId.MAINNET].icon,
  },
]

/** Match `provider.key` in the vault API, which is what the list endpoint filters on. */
export const ETHERFI_PROVIDER_KEY = 'etherfi'
export const SKY_PROVIDER_KEY = 'sky'

export const VAULT_PROTOCOL_OPTIONS: MenuOption[] = [
  AllProtocolsOption,
  { label: 'ether.fi', value: ETHERFI_PROVIDER_KEY, icon: EtherFiLogo },
  // A partner's mark comes from `provider.logo` in the vault API, which is empty for Sky.
  { label: 'Sky', value: SKY_PROVIDER_KEY },
]
