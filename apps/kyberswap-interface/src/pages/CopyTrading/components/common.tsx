import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { ArrowLeft, Zap } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import type { AgentCard, AgentProfile } from 'services/copyTrading/types'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonEmpty, ButtonLight, ButtonPrimary } from 'components/Button'
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

type AgentCellSize = 'sm' | 'lg'

type AgentCellProps = {
  agent: AgentCard | AgentProfile
  className?: string
  size?: AgentCellSize
  subLineExtension?: ReactNode
}

const chartRanges = ['7D', '1M', '3M', 'All'] as const

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

export const LineChartMock = () => {
  const [range, setRange] = useState<(typeof chartRanges)[number]>('1M')

  return (
    <Stack className="gap-9 rounded-xl bg-buttonBlack p-6">
      <Stack className="gap-5">
        <HStack className="flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-medium text-text">Cumulative Realised P&L</h2>
          <HStack className="rounded-full bg-background p-1 text-xs text-subText">
            {chartRanges.map(item => {
              const RangeButton = range === item ? ButtonLight : ButtonEmpty

              return (
                <RangeButton key={item} type="button" onClick={() => setRange(item)} padding="4px 8px">
                  {item}
                </RangeButton>
              )
            })}
          </HStack>
        </HStack>
        <div className="relative h-72 overflow-hidden">
          <div className="absolute inset-0 grid grid-rows-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-b border-border" />
            ))}
          </div>
          <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 900 270">
            <path
              d="M40 132 C75 85 100 118 122 96 C144 72 144 62 166 91 C185 118 220 80 245 112 C270 144 270 142 300 145 C326 148 330 190 354 186 C380 182 370 224 400 215 C430 206 420 176 455 190 C485 202 500 154 532 128 C565 100 590 94 616 114 C640 134 650 72 675 88 C698 104 712 112 740 116 C770 120 770 152 804 150 C830 148 826 200 858 205"
              fill="none"
              stroke="var(--ks-primary)"
              strokeWidth="4"
            />
            <path
              d="M300 145 C326 148 330 190 354 186 C380 182 370 224 400 215 C430 206 420 176 455 190"
              fill="none"
              stroke="var(--ks-red)"
              strokeWidth="4"
            />
            <path
              d="M740 116 C770 120 770 152 804 150 C830 148 826 200 858 205"
              fill="none"
              stroke="var(--ks-red)"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute left-2/3 top-8 h-56 border-l border-dashed border-subText max-md:hidden" />
          <Stack className="absolute left-2/3 top-8 gap-2 rounded-lg bg-background px-4 py-3 text-xs shadow-lg max-md:hidden">
            <span className="text-subText">Nov 23, 2026, 13:00</span>
            <HStack className="gap-2">
              <span className="text-subText">P&L</span>
              <span className="font-medium text-primary">+ $1,256 (+26.5%)</span>
            </HStack>
          </Stack>
        </div>
      </Stack>

      <Stack className="gap-5">
        <h2 className="text-lg font-medium text-text">Capital Value</h2>
        <div className="relative h-64">
          <div className="absolute inset-0 grid grid-rows-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-b border-border" />
            ))}
          </div>
          <HStack className="absolute inset-x-0 bottom-0 h-48 items-end justify-between px-3">
            {[58, 90, 114, 99, 96, 116, 108].map((height, index) => (
              <Stack key={index} className="w-10 items-center gap-2.5">
                <div className={cn('w-full rounded-t bg-blue/40', index === 2 && 'bg-blue')} style={{ height }} />
                <span className="text-xs text-subText">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}</span>
              </Stack>
            ))}
          </HStack>
        </div>
      </Stack>
    </Stack>
  )
}

type ProfileSidePanelProps = {
  copiedCapital: string
  isCopied: boolean
  wishlistTokens: string[]
}

export const ProfileSidePanel = ({ copiedCapital, isCopied, wishlistTokens }: ProfileSidePanelProps) => (
  <Stack className="gap-5">
    <Stack className="gap-5 rounded-xl bg-buttonBlack p-5">
      <h3 className="border-b border-border pb-3 text-base font-medium text-text">
        {isCopied ? 'Your Current Copy' : 'Copy This Agent'}
      </h3>
      {isCopied ? (
        <>
          <HStack className="items-center justify-between">
            <span className="text-sm text-subText">Capital In</span>
            <span className="text-xl font-medium text-primary">{copiedCapital}</span>
          </HStack>
          <HStack className="gap-3.5 max-md:flex-col">
            <div className="w-full flex-1">
              <ButtonLight type="button" padding="10px 12px">
                My Copy
              </ButtonLight>
            </div>
            <div className="w-full flex-1">
              <ButtonPrimary type="button" padding="10px 12px">
                Add Capital
              </ButtonPrimary>
            </div>
          </HStack>
        </>
      ) : (
        <>
          <p className="text-sm text-subText">
            Your funds remain in your personal Smart Contract Wallet. Only proportional trades are executed.
          </p>
          <ButtonPrimary type="button" padding="10px 12px">
            <HStack className="items-center gap-1">
              <Zap size={14} className="fill-warning text-warning" />
              Copy
            </HStack>
          </ButtonPrimary>
        </>
      )}
    </Stack>
    <Stack className="gap-3.5 rounded-xl bg-buttonBlack p-5">
      <HStack className="items-center gap-4">
        <span className="w-20 text-sm text-subText">Win Rate</span>
        <div className="relative h-2 flex-1 rounded-full bg-subText-20">
          <div className="h-full w-5/12 rounded-full bg-gradient-to-r from-blue to-primary" />
          <Center className="left-5/12 absolute top-1/2 h-6 -translate-y-1/2 rounded-md bg-primary px-2 text-xs font-medium text-black">
            45%
          </Center>
        </div>
      </HStack>
      <HStack className="items-center justify-between">
        <span className="text-sm text-subText">Max Drawdown</span>
        <span className="text-sm text-text">-12.5%</span>
      </HStack>
    </Stack>
    <Stack className="gap-3.5 rounded-xl bg-buttonBlack p-5">
      <h3 className="border-b border-border pb-3 text-base font-medium text-text">Strategy & Execution</h3>
      <Stack as="ul" className="list-disc gap-2 pl-5 text-sm text-subText">
        <li className="pl-0">
          <span className="font-medium text-text">Momentum Tracking:</span> Aims to capture sustained price movements
          across L2 networks.
        </li>
        <li className="pl-0">
          <span className="font-medium text-text">Execution Model:</span> Sequential follower execution. Slight lag may
          occur between agent and follower trades.
        </li>
        <li className="pl-0">
          <span className="font-medium text-text">v1 Constraints:</span> Trades only vs Stablecoins (USDC). TP/SL limits
          are manual.
        </li>
      </Stack>
    </Stack>
    <Stack className="gap-3.5 rounded-xl bg-buttonBlack p-5">
      <h3 className="border-b border-border pb-3 text-base font-medium text-text">Wishlisted Tokens</h3>
      <HStack className="flex-wrap gap-2.5">
        {wishlistTokens.map(token => (
          <span key={token} className="rounded-lg border border-border bg-background px-3 py-1 text-sm text-text">
            {token}
          </span>
        ))}
      </HStack>
    </Stack>
  </Stack>
)
