import { Check, Copy, Shield, Zap } from 'react-feather'
import { CopyTradingAgent } from 'services/copyTrading'

import { Center, HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

import { tagClassName } from '../constants'

export const AgentCell = ({ agent, className }: { agent: CopyTradingAgent; className?: string }) => (
  <HStack className={cn('min-w-0 items-center gap-4', className)}>
    <Center className="relative size-10 shrink-0 rounded-full bg-gray text-sm text-text">
      {agent.initials}
      <Center className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white text-xs text-black">
        <Shield size={10} />
      </Center>
    </Center>
    <Stack className="min-w-0 gap-1.5">
      <HStack className="min-w-0 items-center gap-1.5">
        <span className="truncate text-base font-medium text-text">{agent.name}</span>
        {agent.verified && (
          <Center className="size-4 shrink-0 rounded-full bg-blue text-white">
            <Check size={10} />
          </Center>
        )}
        {agent.hot && <Zap size={14} className="shrink-0 fill-warning text-warning" />}
      </HStack>
      <HStack className="min-w-0 flex-wrap items-center gap-2">
        <span className={cn('max-w-full rounded-full px-2 py-0.5 text-xs font-medium', tagClassName[agent.tag])}>
          {agent.tag}
        </span>
        <span className="max-w-full truncate rounded-full bg-subText-20 px-3 py-0.5 text-xs text-subText">
          Claude Sonnet 4.5
        </span>
      </HStack>
    </Stack>
  </HStack>
)

export const AgentIdentity = ({ agent }: { agent: CopyTradingAgent }) => (
  <HStack className="min-w-0 items-center gap-5 max-md:items-start">
    <Center className="relative size-14 shrink-0 rounded-full bg-gray text-2xl text-text">
      {agent.initials}
      <Center className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white text-black">
        <Shield size={10} />
      </Center>
    </Center>
    <Stack className="min-w-0 gap-2">
      <HStack className="min-w-0 items-center gap-2">
        <h1 className="m-0 truncate text-3xl font-normal leading-none text-text">{agent.name}</h1>
        {agent.verified && (
          <Center className="size-5 shrink-0 rounded-full bg-blue text-white">
            <Check size={12} />
          </Center>
        )}
      </HStack>
      <HStack className="flex-wrap items-center gap-2 text-sm text-subText">
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tagClassName[agent.tag])}>{agent.tag}</span>
        <span className="rounded-full bg-subText-20 px-3 py-0.5 text-xs text-subText">Claude Sonnet 4.5</span>
        <span>•</span>
        <span>0x...31ec7</span>
        <Copy size={13} />
        <span>•</span>
        <span>Fee: 10% of profits</span>
        <span>•</span>
        <span className="text-primary">Live since</span>
        <span>2025-03-01</span>
      </HStack>
    </Stack>
  </HStack>
)
