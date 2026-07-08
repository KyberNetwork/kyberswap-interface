import { Check, Copy, Shield, Zap } from 'react-feather'
import type { AgentCard, AgentProfile } from 'services/copyTrading/types'

import { Center, HStack, Stack } from 'components/Stack'
import { tagClassName } from 'pages/CopyTrading/constants'
import {
  formatDate,
  getAgentDisplayName,
  getAgentInitials,
  shortAddress,
  strategyLabel,
} from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const getLeaderAddress = (agent: AgentCard | AgentProfile) =>
  'leaderAddress' in agent ? agent.leaderAddress : agent.leaderAddresses[0]

const isVerifiedAgent = (agent: AgentCard | AgentProfile) =>
  'isVerified' in agent ? agent.isVerified : agent.badges.includes('Verified')

export const AgentCell = ({ agent, className }: { agent: AgentCard | AgentProfile; className?: string }) => (
  <HStack className={cn('min-w-0 items-center gap-4', className)}>
    <Center className="relative size-10 shrink-0 rounded-full bg-gray text-sm text-text">
      {getAgentInitials(getAgentDisplayName(agent))}
      <Center className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white text-xs text-black">
        <Shield size={10} />
      </Center>
    </Center>
    <Stack className="min-w-0 gap-1.5">
      <HStack className="min-w-0 items-center gap-1.5">
        <span className="truncate text-base font-medium text-text">{agent.displayName}</span>
        {isVerifiedAgent(agent) && (
          <Center className="size-4 shrink-0 rounded-full bg-blue text-white">
            <Check size={10} />
          </Center>
        )}
        {agent.isTrending && <Zap size={14} className="shrink-0 fill-warning text-warning" />}
      </HStack>
      <HStack className="min-w-0 flex-wrap items-center gap-2">
        <span
          className={cn(
            'max-w-full rounded-full px-2 py-0.5 text-xs font-medium',
            tagClassName[strategyLabel(agent.strategy)],
          )}
        >
          {strategyLabel(agent.strategy)}
        </span>
        <span className="max-w-full truncate rounded-full bg-subText-20 px-3 py-0.5 text-xs text-subText">
          {agent.modelName}
        </span>
      </HStack>
    </Stack>
  </HStack>
)

export const AgentIdentity = ({ agent }: { agent: AgentCard | AgentProfile }) => (
  <HStack className="min-w-0 items-center gap-5 max-md:items-start">
    <Center className="relative size-14 shrink-0 rounded-full bg-gray text-2xl text-text">
      {getAgentInitials(agent.displayName)}
      <Center className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white text-black">
        <Shield size={10} />
      </Center>
    </Center>
    <Stack className="min-w-0 gap-2">
      <HStack className="min-w-0 items-center gap-2">
        <h1 className="m-0 truncate text-3xl font-normal leading-none text-text">{agent.displayName}</h1>
        {isVerifiedAgent(agent) && (
          <Center className="size-5 shrink-0 rounded-full bg-blue text-white">
            <Check size={12} />
          </Center>
        )}
      </HStack>
      <HStack className="flex-wrap items-center gap-2 text-sm text-subText">
        <span
          className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tagClassName[strategyLabel(agent.strategy)])}
        >
          {strategyLabel(agent.strategy)}
        </span>
        <span className="rounded-full bg-subText-20 px-3 py-0.5 text-xs text-subText">{agent.modelName}</span>
        <span>•</span>
        <span>{shortAddress(getLeaderAddress(agent))}</span>
        <Copy size={13} />
        {'performanceFeePct' in agent && (
          <>
            <span>•</span>
            <span>Fee: {agent.performanceFeePct}% of profits</span>
          </>
        )}
        {'liveSince' in agent && (
          <>
            <span>•</span>
            <span className="text-primary">Live since</span>
            <span>{formatDate(agent.liveSince).split(' ')[0]}</span>
          </>
        )}
      </HStack>
    </Stack>
  </HStack>
)
