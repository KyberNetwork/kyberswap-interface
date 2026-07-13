import { type PropsWithChildren, type ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type { AgentCard, AgentProfile, CopyRunSummary } from 'services/copyTrading/types'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import { Center, HStack, Stack } from 'components/Stack'
import { formatDate, getAgentDisplayName, getAgentInitials } from 'pages/CopyTrading/helpers'
import { shortenAddress } from 'utils'
import { cn } from 'utils/cn'

import { Badge, StrategyBadge } from './Badge'

type CopyTradingPageBackTo = {
  label: string
  to: string
}

type CopyTradingPageProps = PropsWithChildren<{
  backTo?: CopyTradingPageBackTo
  className?: string
}>

type CopyTradingPageHeadingProps = {
  className?: string
  description?: ReactNode
  title: ReactNode
}

type AgentCellSize = 'sm' | 'lg'

type AgentCellProps = {
  agent: AgentCard | AgentProfile
  className?: string
  size?: AgentCellSize
  subLineExtension?: ReactNode
}

const getLeaderAddress = (agent: AgentCard | AgentProfile) =>
  'leaderAddress' in agent ? agent.leaderAddress : agent.leaderAddresses[0]

const getAgentPrimaryChain = (agent: AgentCard | AgentProfile) => agent.chains[0]

const isVerifiedAgent = (agent: AgentCard | AgentProfile) =>
  'isVerified' in agent ? agent.isVerified : agent.badges.includes('Verified')

export const CopyTradingPage = ({ children, backTo, className }: CopyTradingPageProps) => {
  const navigate = useNavigate()

  return (
    <Stack as="main" className={cn('w-full min-w-0 flex-1 gap-4 px-8 py-6 max-md:px-4 max-md:py-8', className)}>
      {backTo && (
        <div className="w-fit">
          <ButtonEmpty
            type="button"
            onClick={() => navigate(backTo.to)}
            padding="0"
            className="text-subText transition-colors hover:text-text focus-visible:text-text"
          >
            <HStack className="items-center gap-2">
              <ArrowLeft size={16} />
              Back to {backTo.label}
            </HStack>
          </ButtonEmpty>
        </div>
      )}
      {children}
    </Stack>
  )
}

export const CopyTradingPageHeading = ({ className, description, title }: CopyTradingPageHeadingProps) => (
  <Stack className={cn('gap-2', className)}>
    <h1 className="text-4xl font-medium text-text max-md:text-3xl">{title}</h1>
    {description && <p className="text-lg text-subText">{description}</p>}
  </Stack>
)

export const AgentCell = ({ agent, className, size = 'sm', subLineExtension }: AgentCellProps) => {
  const chain = getAgentPrimaryChain(agent)
  const displayName = getAgentDisplayName(agent)
  const isLarge = size === 'lg'

  return (
    <HStack className={cn('min-w-0 items-center gap-4', className)}>
      <Center
        className={cn(
          'relative shrink-0 rounded-full bg-buttonGray font-medium text-subText',
          isLarge ? 'size-14 text-2xl' : 'size-10 text-sm',
        )}
      >
        {getAgentInitials(displayName)}
        {chain?.iconUrl && (
          <Center className="absolute -bottom-0.5 -right-0.5">
            <img src={chain.iconUrl} alt={chain.name} className={cn('rounded-full', isLarge ? 'size-5' : 'size-4')} />
          </Center>
        )}
      </Center>
      <Stack className={cn('min-w-0', isLarge ? 'gap-2' : 'gap-1')}>
        <HStack className="min-w-0 items-center gap-2">
          {isLarge ? (
            <h1 className="truncate text-2xl font-medium text-text">{displayName}</h1>
          ) : (
            <span className="truncate text-base font-medium text-text">{displayName}</span>
          )}
          {isVerifiedAgent(agent) && <img src={verifiedIcon} alt="Verified" className="size-5 shrink-0" />}
          {agent.isTrending && <span className="text-sm">🔥</span>}
        </HStack>
        <HStack className={cn('items-center gap-2', isLarge && 'flex-wrap')}>
          <StrategyBadge strategy={agent.strategy} />
          <Badge color="gray">{agent.modelName}</Badge>
          {subLineExtension}
        </HStack>
      </Stack>
    </HStack>
  )
}

export const AgentIdentity = ({ agent }: { agent: AgentCard | AgentProfile }) => (
  <AgentCell
    agent={agent}
    size="lg"
    subLineExtension={
      <HStack className="flex-wrap items-center gap-2 text-sm font-medium text-subText">
        <span>•</span>
        <span>{shortenAddress(getAgentPrimaryChain(agent).chainId, getLeaderAddress(agent))}</span>
        <CopyHelper toCopy={getLeaderAddress(agent)} margin="0" size={13} className="text-subText" />
        {'performanceFeePct' in agent && (
          <>
            <span>•</span>
            <span>Fee:</span>
            <span className="text-text">{agent.performanceFeePct}% of profits</span>
          </>
        )}
        {'liveSince' in agent && (
          <>
            <span>•</span>
            <span className="text-primary">Live since</span>
            <span className="text-text">{formatDate(agent.liveSince).split(' ')[0]}</span>
          </>
        )}
      </HStack>
    }
  />
)

type CopyRunAgentCellProps = {
  agent?: AgentCard
  className?: string
  run: Pick<CopyRunSummary, 'agentId' | 'chainId'>
}

export const CopyRunAgentCell = ({ agent, className, run }: CopyRunAgentCellProps) => {
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
