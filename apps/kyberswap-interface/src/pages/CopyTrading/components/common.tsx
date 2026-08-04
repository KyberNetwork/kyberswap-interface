import { type PropsWithChildren, type ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type {
  AgentCard,
  AgentProfile,
  AgentSnapshot,
  CopyRunStatus,
  CopyRunSummary,
  PositionLifecycle,
  PositionQuantityState,
} from 'services/copyTrading/types'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import { Center, HStack, Stack } from 'components/Stack'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getAgentDisplayName, getAgentInitials, strategyCategoryKey } from 'pages/CopyTrading/helpers'
import { shortenAddress, shortenHash } from 'utils/address'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

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

type ContentPanelProps = PropsWithChildren<{
  bodyClassName?: string
  className?: string
  headerAside?: ReactNode
  title: string
  titleAddon?: ReactNode
}>

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

export const CopyTradingPage = ({ children, backTo, className }: CopyTradingPageProps) => {
  const navigate = useNavigate()

  return (
    <Stack as="main" className={cn('w-full min-w-0 flex-1 gap-4 px-8 pb-20 pt-6 max-md:px-4 max-md:pt-8', className)}>
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
    <h1 className="text-2xl font-medium text-text">{title}</h1>
    {description && <p className="text-base text-subText">{description}</p>}
  </Stack>
)

export const StickySideColumn = ({ children }: PropsWithChildren) => (
  <aside className="sticky top-4 self-start max-xl:static">{children}</aside>
)

export const ContentPanel = ({
  bodyClassName,
  children,
  className,
  headerAside,
  title,
  titleAddon,
}: ContentPanelProps) => (
  <Stack className={cn('overflow-hidden rounded-xl bg-buttonBlack-60', className)}>
    <HStack className="flex-wrap items-center justify-between gap-4 border-b border-tableHeader bg-background-60 px-6 py-3">
      <HStack className="items-center gap-2">
        <h2 className="text-base font-medium text-text">{title}</h2>
        {titleAddon}
      </HStack>
      {headerAside}
    </HStack>
    <Stack className={cn('gap-0', bodyClassName)}>{children}</Stack>
  </Stack>
)

export const ShortenedId = ({ value }: { value?: string }) => (
  <span className="whitespace-nowrap" title={value}>
    {value ? shortenHash(value, 3) : '—'}
  </span>
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
            <span>Flat fee:</span>
            <span className="text-text">{agent.flatFeeRatePct}%</span>
          </>
        )}
        {'liveSince' in agent && (
          <>
            <span>•</span>
            <span className="text-primary">Live since</span>
            <span className="text-text">{formatDateTime(agent.liveSince)}</span>
          </>
        )}
      </HStack>
    }
  />
)

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

const copyRunStatusLabel: Record<CopyRunStatus, string> = {
  active: 'Active',
  closing: 'Closing',
  stopped: 'Stopped',
  closed: 'Closed',
  unknown: 'Unknown',
}

export const CopyRunStatusBadge = ({ status }: { status: CopyRunStatus }) => (
  <span
    className={cn(
      'inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium',
      status === 'active' && 'bg-primary-12 text-primary',
      status === 'closing' && 'bg-blue/10 text-blue',
      status === 'stopped' && 'bg-red-20 text-red',
      status === 'closed' && 'bg-subText-20 text-subText',
      status === 'unknown' && 'bg-subText-20 text-subText',
    )}
  >
    {copyRunStatusLabel[status]}
  </span>
)

const positionLifecycleLabel: Record<PositionLifecycle, string> = {
  active: 'Open',
  closing: 'Closing',
  closed: 'Closed',
  unknown: 'Status unavailable',
}

const positionQuantityLabel: Record<PositionQuantityState, string | undefined> = {
  open_full: undefined,
  open_partial: 'Partially sold',
  closed: undefined,
  unknown: undefined,
}

export const PositionLifecycleBadge = ({
  lifecycle,
  quantityState,
}: {
  lifecycle: PositionLifecycle
  quantityState: PositionQuantityState
}) => {
  const quantityLabel =
    lifecycle === 'active' || lifecycle === 'closing' ? positionQuantityLabel[quantityState] : undefined

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
        lifecycle === 'active' && 'bg-primary-12 text-primary',
        lifecycle === 'closing' && 'bg-blue/10 text-blue',
        lifecycle === 'closed' && 'bg-subText-20 text-subText',
        lifecycle === 'unknown' && 'bg-subText-20 text-subText',
      )}
    >
      {positionLifecycleLabel[lifecycle]}
      {quantityLabel ? ` · ${quantityLabel}` : ''}
    </span>
  )
}

export const OwnerWalletRequired = () => (
  <Center className="min-h-[240px] rounded-xl bg-buttonBlack-60 px-6 text-center">
    <Stack className="items-center gap-2">
      <span className="text-base font-medium text-text">Connect your wallet</span>
      <span className="text-sm text-subText">Connect a wallet to view your Copy Trading data.</span>
    </Stack>
  </Center>
)
