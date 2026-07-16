import { Token as TokenSchema } from '@kyber/schema'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { ChevronDown } from 'react-feather'

import { HStack } from 'components/Stack'
import { APP_PATHS, ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKENS } from 'constants/tokens'
import { getTokenLogoURL } from 'utils'
import { cn } from 'utils/cn'

export const enablePreview = false

export const PRIMARY_CHAINS: ChainId[] = [
  ChainId.BASE,
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
]
export const TIP_LINK_CHAINS: ChainId[] = SUPPORTED_NETWORKS.filter(
  chainId => WETH[chainId] && DEFAULT_OUTPUT_TOKENS[chainId],
)
export const SOLID_COLORS: string[] = ['#235F52', '#244666', '#6D3345', '#715825', '#412762', '#6D3F70', '#3E653F']
export const MAX_IMAGE_SIZE = 1024 * 1024
export const LINK_PLACEHOLDER = `https://kyberswap.com${APP_PATHS.USER_SWAP}/...`
export const TIP_LINK_CLIENT_ID = 'kyberswap'
export const DEFAULT_TIP = 10

export const isCreatorNameValid = (value: string) => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const words = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const hasReservedKS = words.includes('ks') || words.some((word, index) => word === 'k' && words[index + 1] === 's')

  return (
    !normalized ||
    (!normalized.includes('kyber') && !normalized.includes('kswap') && normalized !== 'ks' && !hasReservedKS)
  )
}

export type BackgroundMode = 'default' | 'solid' | 'image'
export type TokenSelectorTarget = 'input' | 'output'

export type TipLinkTradeType = 'swap' | 'limit_order' | 'cross_chain'

export type TipLinkAttribution = {
  tip_receiver: string
  tip_client_id: string
  tip_creator_name?: string
}

/**
 * Derive tip-link attribution from the current swap URL params. Returns null for any
 * trade that did not originate from a community tip link (a regular swap, or a partner
 * swap with a different clientId), so callers can simply skip tracking on null.
 */
export const getTipLinkAttribution = (searchParams: URLSearchParams): TipLinkAttribution | null => {
  const clientId = searchParams.get('clientId')
  const feeReceiver = searchParams.get('feeReceiver')
  if (clientId !== TIP_LINK_CLIENT_ID || !feeReceiver) return null
  const creatorName = searchParams.get('creatorName')?.trim()
  return {
    tip_receiver: feeReceiver,
    tip_client_id: clientId,
    tip_creator_name: creatorName || undefined,
  }
}

export const getChainLabel = (chainId: ChainId) => {
  return NETWORKS_INFO[chainId].name
}

export const isSameToken = (tokenA?: TokenSchema, tokenB?: TokenSchema) =>
  !!tokenA?.address && !!tokenB?.address && tokenA.address.toLowerCase() === tokenB.address.toLowerCase()

export const getDefaultInputToken = (chainId: ChainId): TokenSchema => {
  const networkInfo = NETWORKS_INFO[chainId]
  return {
    address: ETHER_ADDRESS,
    symbol: networkInfo.nativeToken.symbol,
    name: networkInfo.nativeToken.name,
    decimals: networkInfo.nativeToken.decimal,
    logo: networkInfo.nativeToken.logo,
  }
}

export const getDefaultOutputToken = (chainId: ChainId): TokenSchema | undefined => {
  const token = DEFAULT_OUTPUT_TOKENS[chainId]
  if (!token) return
  return {
    address: token.address,
    symbol: token.symbol || '',
    name: token.name || token.symbol || '',
    decimals: token.decimals,
    logo: getTokenLogoURL(token.address, chainId),
  }
}

export const getCurrencyParam = (token: TokenSchema, chainId: ChainId) => {
  const native = NETWORKS_INFO[chainId].nativeToken
  return token.address.toLowerCase() === ETHER_ADDRESS.toLowerCase() && token.symbol === native.symbol
    ? native.symbol
    : token.address
}

export const SectionLabel = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <div className="text-xs font-semibold uppercase text-subText">
    {children} {optional && <span className="font-medium normal-case text-subText/70">Optional</span>}
  </div>
)

export const FieldShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <HStack className={cn('h-10 items-center rounded-lg bg-[#252525] px-3 text-sm text-text', className)}>
    {children}
  </HStack>
)

export const TokenBadge = ({ token, onClick }: { token?: TokenSchema; onClick: () => void }) => (
  <HStack as="button" onClick={onClick} className="group min-w-0 flex-1 text-left">
    <FieldShell className="w-full justify-between transition-colors group-hover:bg-[#303030]">
      <HStack className="min-w-0 items-center gap-2">
        {token?.logo && <img src={token.logo} alt="" className="size-5 rounded-full" />}
        <span className="truncate font-medium">{token?.symbol || 'Select'}</span>
      </HStack>
      <ChevronDown size={14} className="shrink-0 text-subText transition-colors group-hover:text-text" />
    </FieldShell>
  </HStack>
)
