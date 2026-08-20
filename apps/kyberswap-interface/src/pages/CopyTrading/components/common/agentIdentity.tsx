import type { PropsWithChildren, ReactNode } from 'react'
import type { AgentCard, AgentProfile, AgentSnapshot } from 'services/copyTrading/types/agents'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { CopyRunStatus, StrategyKey } from 'services/copyTrading/types/primitives'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import CopyHelper from 'components/Copy'
import { Center, HStack, Stack } from 'components/Stack'
import { CopyRunStatusBadge } from 'pages/CopyTrading/components/common/status'
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
import { formatShortDate } from 'utils/time'

type BadgeColor = 'magenta' | 'blue' | 'primary' | 'gray'

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

const getStrategyBadgeColor = (strategy: StrategyKey): BadgeColor =>
  strategy === 'active' ? 'magenta' : strategy === 'diversified' ? 'blue' : strategy === 'focused' ? 'primary' : 'gray'

const StrategyBadge = ({ strategy }: { strategy: StrategyKey }) => (
  <Badge color={getStrategyBadgeColor(strategy)}>{strategyLabel(strategy)}</Badge>
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
  nameExtension?: ReactNode
  size?: AgentCellSize
  subLineExtension?: ReactNode
}

const getLeaderAddress = (agent: AgentCard | AgentProfile | AgentSnapshot) => agent.leaderAddress

const isVerifiedAgent = (agent: AgentCard | AgentProfile | AgentSnapshot) => agent.isVerified

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

export const AgentCell = ({ agent, className, nameExtension, size = 'sm', subLineExtension }: AgentCellProps) => {
  const displayName = getAgentDisplayName(agent)
  const isLarge = size === 'lg'
  const strategies = Array.from(
    new Set(agent.strategyCategories.map(strategyCategoryKey).filter(strategy => strategy !== 'unknown')),
  )
  if (!strategies.length) strategies.push(agent.strategy)

  return (
    <HStack className={cn('min-w-0 items-center gap-4', className)}>
      <AgentAvatar avatarUrl={agent.avatarUrl} chainId={agent.chainId} displayName={displayName} size={size} />
      <Stack className={cn('min-w-0', isLarge ? 'gap-2' : 'gap-1')}>
        <HStack className="min-w-0 items-center gap-2">
          {isLarge ? (
            <h1 className="truncate text-2xl font-medium text-text">{displayName}</h1>
          ) : (
            <span className="truncate text-base font-medium text-text">{displayName}</span>
          )}
          {isVerifiedAgent(agent) && <img src={verifiedIcon} alt="Verified" className="size-5 shrink-0" />}
          {nameExtension}
          {'isTrending' in agent && agent.isTrending && <span className="text-sm">🔥</span>}
        </HStack>
        <HStack className={cn('items-center gap-2', isLarge && 'flex-wrap')}>
          {strategies.map(strategy => (
            <StrategyBadge key={strategy} strategy={strategy} />
          ))}
          <Badge color="gray">{agent.modelName}</Badge>
          {subLineExtension}
        </HStack>
      </Stack>
    </HStack>
  )
}

type CopyRunAgentCellProps = {
  className?: string
  run: Pick<CopyRunSummary, 'agentId' | 'agentSnapshot' | 'chainId'>
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

export const AgentIdentity = ({ agent, status }: { agent: AgentCard | AgentProfile; status?: CopyRunStatus }) => (
  <AgentCell
    agent={agent}
    nameExtension={status ? <CopyRunStatusBadge status={status} /> : undefined}
    size="lg"
    subLineExtension={
      <HStack className="flex-wrap items-center gap-2 text-sm font-medium text-subText">
        <span>•</span>
        <span>{shortenAddress(agent.chainId, getLeaderAddress(agent))}</span>
        <CopyHelper toCopy={getLeaderAddress(agent)} margin="0" size={13} className="text-subText" />
        {'flatFeeRatePct' in agent && agent.flatFeeRatePct && (
          <>
            <span>•</span>
            <span>Fee:</span>
            <span className="text-text">{percent(agent.flatFeeRatePct)}</span>
          </>
        )}
        {'liveSince' in agent && (
          <>
            <span>•</span>
            <span className="text-primary">Live since</span>
            <span className="text-text">{formatShortDate(agent.liveSince)}</span>
          </>
        )}
      </HStack>
    }
  />
)
