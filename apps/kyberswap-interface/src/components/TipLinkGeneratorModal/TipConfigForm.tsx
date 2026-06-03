import { Token as TokenSchema } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ChevronDown, Repeat } from 'react-feather'

import { Center, HStack, Stack } from 'components/Stack'
import {
  FieldShell,
  PRIMARY_CHAINS,
  SectionLabel,
  TIP_LINK_CHAINS,
  TokenBadge,
  TokenSelectorTarget,
  getChainLabel,
} from 'components/TipLinkGeneratorModal/shared'
import { NETWORKS_INFO } from 'constants/networks'
import { cn } from 'utils/cn'

type Props = {
  account?: string
  chainId: ChainId
  creatorName: string
  inputToken: TokenSchema
  isReceiverValid: boolean
  isUsingConnectedAddress: boolean
  onChainSelect: (chainId: ChainId) => void
  onOpenNetworkModal: () => void
  onOpenTokenSelector: (target: TokenSelectorTarget) => void
  onReceiverChange: (value: string) => void
  onUseConnectedAddress: () => void
  onCreatorNameChange: (value: string) => void
  onWalletConnect: () => void
  onSwapTokens: () => void
  outputToken?: TokenSchema
  receiver: string
  showNetworkModal: boolean
}

export default function TipConfigForm({
  account,
  chainId,
  creatorName,
  inputToken,
  isReceiverValid,
  isUsingConnectedAddress,
  onChainSelect,
  onOpenNetworkModal,
  onOpenTokenSelector,
  onReceiverChange,
  onUseConnectedAddress,
  onCreatorNameChange,
  onWalletConnect,
  onSwapTokens,
  outputToken,
  receiver,
  showNetworkModal,
}: Props) {
  const moreChains: ChainId[] = TIP_LINK_CHAINS.filter(item => !PRIMARY_CHAINS.includes(item))
  const selectedMoreChainInfo = moreChains.some(item => item === chainId) ? NETWORKS_INFO[chainId] : undefined

  return (
    <Stack className="gap-5">
      <Stack className="gap-2">
        <SectionLabel>Network</SectionLabel>
        <HStack className="flex-wrap gap-2">
          {PRIMARY_CHAINS.map(item => {
            const itemInfo = NETWORKS_INFO[item]
            return (
              <HStack
                as="button"
                key={item}
                onClick={() => onChainSelect(item)}
                className={cn(
                  'h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                  item === chainId
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-transparent bg-[#252525] text-subText hover:border-border hover:bg-[#303030] hover:text-text',
                )}
              >
                <img src={itemInfo.icon} alt="" className="size-4 rounded-full" />
                {getChainLabel(item)}
              </HStack>
            )
          })}
          {!!moreChains.length && (
            <HStack
              as="button"
              onClick={onOpenNetworkModal}
              className={cn(
                'h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                selectedMoreChainInfo
                  ? 'border-primary bg-primary/15 text-primary'
                  : showNetworkModal
                  ? 'border-primary text-primary'
                  : 'border-dashed border-border text-subText hover:border-primary hover:text-text',
              )}
            >
              {selectedMoreChainInfo && <img src={selectedMoreChainInfo.icon} alt="" className="size-4 rounded-full" />}
              {selectedMoreChainInfo ? getChainLabel(chainId) : 'More'}
              <ChevronDown size={12} />
            </HStack>
          )}
        </HStack>
      </Stack>

      <Stack className="gap-2">
        <SectionLabel>Token Pair</SectionLabel>
        <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
          <TokenBadge token={inputToken} onClick={() => onOpenTokenSelector('input')} />
          <Center
            as="button"
            onClick={onSwapTokens}
            disabled={!outputToken}
            className="mx-auto size-7 rounded-full text-subText transition-colors hover:bg-white/10 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Repeat size={14} />
          </Center>
          <TokenBadge token={outputToken} onClick={() => onOpenTokenSelector('output')} />
        </div>
      </Stack>

      <Stack className="gap-2">
        <SectionLabel>
          Wallet Address <span className="normal-case text-subText/70">Receives tips</span>
        </SectionLabel>
        <FieldShell className="gap-2 pr-1">
          <input
            value={receiver}
            onChange={event => onReceiverChange(event.target.value)}
            placeholder="0x... paste or connect wallet"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subText/60"
          />
          {!account ? (
            <button
              onClick={onWalletConnect}
              className="h-6 rounded-full border border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Connect
            </button>
          ) : !isUsingConnectedAddress ? (
            <button
              onClick={onUseConnectedAddress}
              className="h-6 rounded-full border border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Use Wallet
            </button>
          ) : null}
        </FieldShell>
        {!isReceiverValid && <div className="text-xs text-warning">Invalid receiver address</div>}
      </Stack>

      <Stack className="gap-2">
        <SectionLabel optional>Display Name</SectionLabel>
        <FieldShell>
          <input
            value={creatorName}
            onChange={event => onCreatorNameChange(event.target.value)}
            placeholder="e.g. DefiAlpha"
            className="w-full bg-transparent text-sm outline-none placeholder:text-subText/60"
          />
        </FieldShell>
      </Stack>
    </Stack>
  )
}
