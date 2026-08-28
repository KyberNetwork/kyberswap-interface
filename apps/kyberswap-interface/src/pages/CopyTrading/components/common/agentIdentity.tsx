import type { PropsWithChildren } from 'react'
import type { AgentCard, AgentProfile, AgentSnapshot } from 'services/copyTrading/types/agents'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { StrategyKey } from 'services/copyTrading/types/primitives'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import CopyHelper from 'components/Copy'
import { Center, HStack, Stack } from 'components/Stack'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import {
  getAgentDisplayName,
  getAgentInitials,
  percent,
  strategyCategoryKey,
  strategyLabel,
} from 'pages/CopyTrading/helpers'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { formatDate } from 'utils/time'

type BadgeColor = 'magenta' | 'blue' | 'primary' | 'gray'

const strategyBadgeColors: Record<StrategyKey, BadgeColor> = {
  active: 'magenta',
  diversified: 'blue',
  focused: 'primary',
  unknown: 'gray',
}

const Badge = ({ children, color }: PropsWithChildren<{ color: BadgeColor }>) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
      color === 'magenta' && 'bg-[rgb(35_16_29)] text-[#EF4A9F]',
      color === 'blue' && 'bg-blue/20 text-blue',
      color === 'primary' && 'bg-primary-12 text-primary',
      color === 'gray' && 'bg-subText-20 px-3 text-subText',
    )}
  >
    {children}
  </span>
)

const StrategyBadge = ({ strategy }: { strategy: StrategyKey }) => (
  <Badge color={strategyBadgeColors[strategy]}>{strategyLabel(strategy)}</Badge>
)

type AgentCellSize = 'sm' | 'lg'

type AgentAvatarProps = {
  avatarUrl?: string
  chainId: number
  displayName: string
  size?: AgentCellSize
}

type AgentCellProps = {
  agent: AgentCard | AgentProfile | AgentSnapshot
  className?: string
}

type Agent = AgentCard | AgentProfile | AgentSnapshot

const getAgentStrategies = (agent: Agent) => {
  const strategies = Array.from(
    new Set(agent.strategyCategories.map(strategyCategoryKey).filter(strategy => strategy !== 'unknown')),
  )
  return strategies.length ? strategies : [agent.strategy]
}

const AgentName = ({ agent, large }: { agent: Agent; large?: boolean }) => {
  const displayName = getAgentDisplayName(agent)

  return (
    <HStack className="min-w-0 items-center gap-2">
      {large ? (
        <h1 className="truncate text-lg font-medium text-text sm:text-2xl">{displayName}</h1>
      ) : (
        <span className="truncate text-base font-medium text-text">{displayName}</span>
      )}
      {agent.isVerified && <img src={verifiedIcon} alt="Verified" className="size-5 shrink-0" />}
      {'isTrending' in agent && agent.isTrending && <span className="text-sm">🔥</span>}
    </HStack>
  )
}

const AgentStrategies = ({ agent }: { agent: Agent }) => (
  <>
    {getAgentStrategies(agent).map(strategy => (
      <StrategyBadge key={strategy} strategy={strategy} />
    ))}
  </>
)

const MetadataGroup = ({ children }: PropsWithChildren) => (
  <HStack className="shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap">
    <span>•</span>
    {children}
  </HStack>
)

export const AgentAvatar = ({ avatarUrl, chainId, displayName, size = 'sm' }: AgentAvatarProps) => {
  const { chains } = useCopyTradingContext()
  const chain = chains.find(item => item.chainId === chainId)
  const isLarge = size === 'lg'

  return (
    <Center
      className={cn(
        'relative shrink-0 rounded-full bg-buttonGray font-medium text-subText',
        isLarge ? 'size-14 text-2xl' : 'size-10 text-sm',
      )}
    >
      {getAgentInitials(displayName)}
      {avatarUrl && <img src={avatarUrl} alt="" className="absolute inset-0 size-full rounded-full object-cover" />}
      {chain?.iconUrl && (
        <Center className="absolute -bottom-0.5 -right-0.5">
          <img src={chain.iconUrl} alt={chain.name} className={cn('rounded-full', isLarge ? 'size-5' : 'size-4')} />
        </Center>
      )}
    </Center>
  )
}

export const AgentCell = ({ agent, className }: AgentCellProps) => {
  const displayName = getAgentDisplayName(agent)

  return (
    <HStack className={cn('min-w-0 items-center gap-4', className)}>
      <AgentAvatar avatarUrl={agent.avatarUrl} chainId={agent.chainId} displayName={displayName} />
      <Stack className="min-w-0 flex-1 gap-1">
        <AgentName agent={agent} />
        <HStack className="flex-wrap items-center gap-2">
          <AgentStrategies agent={agent} />
        </HStack>
      </Stack>
    </HStack>
  )
}

type CopyRunAgentCellProps = {
  className?: string
  run: Pick<CopyRunListItem, 'agentId' | 'agentSnapshot' | 'chainId'>
}

export const CopyRunAgentCell = ({ className, run }: CopyRunAgentCellProps) => {
  const agent = run.agentSnapshot
  if (agent) return <AgentCell agent={agent} className={className} />

  const fallbackName = run.agentId.replace(/[-_]/g, ' ')

  return (
    <HStack className={cn('min-w-0 items-center gap-4', className)}>
      <Center className="size-10 shrink-0 rounded-full bg-buttonGray text-sm font-medium text-subText">
        {getAgentInitials(fallbackName)}
      </Center>
      <Stack className="min-w-0 gap-1">
        <span className="truncate text-base font-medium text-text">{run.agentId}</span>
        <HStack className="items-center gap-2">
          <Badge color="gray">Chain {run.chainId}</Badge>
        </HStack>
      </Stack>
    </HStack>
  )
}

export const AgentIdentity = ({ agent }: { agent: AgentCard | AgentProfile }) => {
  const displayName = getAgentDisplayName(agent)

  return (
    <HStack className="min-w-0 items-center gap-4">
      <AgentAvatar avatarUrl={agent.avatarUrl} chainId={agent.chainId} displayName={displayName} size="lg" />
      <Stack className="min-w-0 flex-1 gap-2">
        <AgentName agent={agent} large />
        <HStack className="flex-wrap items-center gap-2 text-sm font-medium text-subText">
          <AgentStrategies agent={agent} />
          <Badge color="gray">{agent.modelName}</Badge>
          <MetadataGroup>
            <span>{shortenAddress(agent.chainId, agent.leaderAddress)}</span>
            <CopyHelper toCopy={agent.leaderAddress} margin="0" size={13} className="text-subText" />
          </MetadataGroup>
          {'flatFeeRatePct' in agent && agent.flatFeeRatePct && (
            <MetadataGroup>
              <span>Fee:</span>
              <span className="text-text">{percent(agent.flatFeeRatePct)}</span>
            </MetadataGroup>
          )}
          {'liveSince' in agent && (
            <MetadataGroup>
              <span className="text-primary">Live since</span>
              <span className="text-text">{formatDate(agent.liveSince)}</span>
            </MetadataGroup>
          )}
        </HStack>
      </Stack>
    </HStack>
  )
}
