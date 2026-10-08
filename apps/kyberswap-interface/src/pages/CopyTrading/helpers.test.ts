import { beforeEach, describe, expect, it, vi } from 'vitest'

import { APP_PATHS } from 'constants/index'
import AgentProfile from 'pages/CopyTrading/AgentProfile'
import CopyDetail from 'pages/CopyTrading/CopyDetail'
import { canAttemptPreparation, formatUsd, percent, sumUsdValues } from 'pages/CopyTrading/helpers'

describe('Copy Trading metric and preparation rules', () => {
  it('distinguishes missing metrics from an actual zero', () => {
    expect(formatUsd(undefined)).toBe('N/A')
    expect(percent(undefined)).toBe('N/A')
    expect(formatUsd('0')).not.toBe('N/A')
    expect(percent('0')).not.toBe('N/A')
  })

  it('only calculates combined USD metrics when every value is available', () => {
    expect(sumUsdValues('10.5', '-2')).toBe('8.5')
    expect(sumUsdValues('10.5', undefined)).toBeUndefined()
  })

  it('allows TRY_PREPARE to call the authoritative preparation flow', () => {
    expect(canAttemptPreparation({ status: 'ADVISORY_ACTION_STATUS_TRY_PREPARE' })).toBe(true)
    expect(canAttemptPreparation({ status: 'ADVISORY_ACTION_STATUS_AVAILABLE' })).toBe(true)
    expect(canAttemptPreparation({ status: 'ADVISORY_ACTION_STATUS_UNAVAILABLE' })).toBe(false)
  })
})

const mocks = vi.hoisted(() => ({
  agent: vi.fn(),
  copyRun: vi.fn(),
  copyRuns: vi.fn(),
  context: vi.fn(),
  restoring: vi.fn(),
  params: vi.fn(),
}))
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  useCallback: (callback: unknown) => callback,
}))
vi.mock('framer-motion', async importOriginal => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useMotionValue: actual.motionValue }
})
vi.mock('react-router-dom', () => ({
  useParams: mocks.params,
  useLocation: () => ({ search: '?profileTab=history', hash: '#detail' }),
  Navigate: 'navigate',
}))
vi.mock('services/copyTrading/api/endpoints/agents', () => ({ default: { useGetAgentQuery: mocks.agent } }))
vi.mock('services/copyTrading/api/endpoints/copyRuns', () => ({
  default: { useGetCopyRunQuery: mocks.copyRun, useGetCopyRunsQuery: mocks.copyRuns },
}))
vi.mock('hooks/useIsWalletRestoring', () => ({ default: mocks.restoring }))
vi.mock('hooks/useTab', () => ({ default: () => ({ activeTab: undefined, setActiveTab: vi.fn() }) }))
vi.mock('pages/CopyTrading/context', () => ({ useCopyTradingContext: mocks.context }))
vi.mock('components/LocalLoader', () => ({ default: 'loader' }))
vi.mock('pages/CopyTrading/components/common/layout', () => ({
  CopyTradingPage: 'page',
  ResponsiveDetailGrid: 'grid',
  ResponsiveDetailItem: 'item',
  StickySideColumn: 'sidebar',
}))
vi.mock('pages/CopyTrading/components/common/status', () => ({
  CopyRunStatusBadge: 'copy-status',
  CopyTradingReadError: 'read-error',
  OwnerWalletRequired: 'wallet-required',
}))
vi.mock('pages/CopyTrading/components/common/agentIdentity', () => ({
  AgentIdentity: 'agent',
  CopyRunAgentCell: 'copy-run-agent',
}))
vi.mock('pages/CopyTrading/components/common/DetailTabBar', () => ({ DetailTabBar: 'tabs' }))
vi.mock('pages/CopyTrading/components/Leaderboard', () => ({ default: 'leaderboard' }))
vi.mock('pages/CopyTrading/AgentProfile/AgentInstruction', () => ({ default: 'instruction' }))
vi.mock('pages/CopyTrading/AgentProfile/AgentStats', () => ({ default: 'stats' }))
vi.mock('pages/CopyTrading/AgentProfile/TabActions', () => ({ default: 'actions' }))
vi.mock('pages/CopyTrading/AgentProfile/TabHistory', () => ({ default: 'history' }))
vi.mock('pages/CopyTrading/AgentProfile/TabPositions', () => ({ default: 'positions' }))
vi.mock('pages/CopyTrading/CopyDetail/CopyDetailTabs', () => ({ CopyDetailTabs: 'tabs' }))
vi.mock('pages/CopyTrading/CopyDetail/CopyRunPerformance', () => ({ default: 'performance' }))
vi.mock('pages/CopyTrading/CopyDetail/CopySidePanel', () => ({ default: 'side-panel' }))

const query = (currentData?: unknown, error?: unknown) => ({
  currentData,
  error,
  isFetching: false,
  isLoading: false,
  isUninitialized: false,
  refetch: vi.fn(),
})
const profile = { data: { agentId: 'agent-1', chainId: 8453 } }
const run = { data: { copyRunId: 'run-1', agentId: 'agent-1', chainId: 8453 } }
const chainContext = {
  selectedChainId: 8453,
  chains: [
    { chainId: 8453, slug: 'base' },
    { chainId: 1, slug: 'ethereum' },
  ],
}

describe('detail page read recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.params.mockReturnValue({ agentCode: 'agent-1', copyId: 'run-1' })
    mocks.context.mockReturnValue({ ...chainContext, ownerAddress: 'owner-1' })
    mocks.restoring.mockReturnValue(false)
    mocks.agent.mockReturnValue(query(profile))
    mocks.copyRun.mockReturnValue(query(run))
    mocks.copyRuns.mockReturnValue(query({ data: [] }))
  })
  it.each([503, 'FETCH_ERROR'])('keeps both pages open on initial %s errors and retries only missing reads', status => {
    const agent = query(undefined, { status })
    const copyRuns = mocks.copyRuns()
    mocks.agent.mockReturnValue(agent)
    const agentPage = AgentProfile()
    expect(agentPage.type).toBe('page')
    expect(agentPage.props.children.type).toBe('read-error')
    expect(agentPage.props.children.props.resourceUnavailable).toBe(false)
    agentPage.props.children.props.onRetry()
    expect(agent.refetch).toHaveBeenCalledOnce()
    expect(copyRuns.refetch).not.toHaveBeenCalled()

    const copyRun = query(undefined, { status })
    mocks.copyRun.mockReturnValue(copyRun)
    const copyPage = CopyDetail({ backPath: 'my-copies' })
    expect(copyPage.type).toBe('page')
    expect(copyPage.props.children.type).toBe('read-error')
    expect(copyPage.props.children.props.resourceUnavailable).toBe(false)
    copyPage.props.children.props.onRetry()
    expect(copyRun.refetch).toHaveBeenCalledOnce()
    // No extra Agent request before the Copy Run is loaded.
    expect(agent.refetch).toHaveBeenCalledOnce()
  })

  it.each([1, undefined])('renders details without redirecting to entity chain from %s', selectedChainId => {
    mocks.context.mockReturnValue({ ...chainContext, selectedChainId, ownerAddress: 'owner-1' })
    expect(AgentProfile().type).toBe('page')
    expect(CopyDetail({ backPath: 'history' }).type).toBe('page')
  })

  it('keeps owner lookup failures retryable without treating the public Agent as unavailable', () => {
    const copyRuns = query(undefined, { status: 403 })
    const agent = mocks.agent()
    mocks.copyRuns.mockReturnValue(copyRuns)
    const page = AgentProfile()
    expect(page.props.children.type).toBe('read-error')
    expect(page.props.children.props.resourceUnavailable).toBe(false)
    page.props.children.props.onRetry()
    expect(copyRuns.refetch).toHaveBeenCalledOnce()
    expect(agent.refetch).not.toHaveBeenCalled()
  })

  it.each([403, 404, 503, 'FETCH_ERROR'])('renders Copy Detail when the Agent read fails with %s', status => {
    mocks.agent.mockReturnValue(query(undefined, { status }))
    const page = CopyDetail({ backPath: 'history' })
    expect(page.props.children[0].props.children[0]).toMatchObject({
      type: 'copy-run-agent',
      props: { run: run.data },
    })
    expect(page.props.children[1].props).toMatchObject({ run: run.data, agent: undefined })
  })

  it('uses the run snapshot while Agent Detail is loading', () => {
    const agentSnapshot = { agentId: 'agent-1', displayName: 'Saved agent' }
    mocks.copyRun.mockReturnValue(query({ data: { ...run.data, agentSnapshot } }))
    mocks.agent.mockReturnValue({ ...query(), isFetching: true })
    const page = CopyDetail({ backPath: 'my-copies' })
    expect(page.props.children[0]).toMatchObject({ type: 'agent', props: { agent: agentSnapshot } })
    expect(page.props.children[1].props.run.copyRunId).toBe('run-1')
  })

  it.each([403, 404])('keeps missing/forbidden resources (%s) on the page with only the header Back to', status => {
    mocks.agent.mockReturnValue(query(undefined, { status }))
    expect(AgentProfile()).toMatchObject({
      type: 'page',
      props: {
        backTo: { label: 'Leaderboard', to: APP_PATHS.COPY_TRADING + '/base' },
        children: { type: 'read-error', props: { resourceUnavailable: true } },
      },
    })
    mocks.agent.mockReturnValue(query(profile))
    mocks.copyRun.mockReturnValue(query(undefined, { status }))
    expect(CopyDetail({ backPath: 'history' })).toMatchObject({
      type: 'page',
      props: {
        backTo: { label: 'History', to: APP_PATHS.COPY_TRADING + '/base/history' },
        children: { type: 'read-error', props: { resourceUnavailable: true } },
      },
    })
    expect(mocks.agent().refetch).not.toHaveBeenCalled()
    expect(mocks.copyRun().refetch).not.toHaveBeenCalled()
  })

  it('shows the error without a retry for missing route IDs and skipped queries', () => {
    mocks.params.mockReturnValue({})
    mocks.agent.mockReturnValue({ ...query(), isUninitialized: true })
    mocks.copyRun.mockReturnValue({ ...query(), isUninitialized: true })
    expect(AgentProfile().props.children).toMatchObject({ type: 'read-error', props: { resourceUnavailable: true } })
    expect(CopyDetail({ backPath: 'my-copies' }).props.children).toMatchObject({
      type: 'read-error',
      props: { resourceUnavailable: true },
    })
  })

  it('keeps cached content during background fetches and transient failures', () => {
    mocks.agent.mockReturnValue({ ...query(profile, { status: 503 }), isFetching: true })
    mocks.copyRun.mockReturnValue({ ...query(run, { status: 503 }), isFetching: true })
    mocks.copyRuns.mockReturnValue({ ...query({ data: [] }, { status: 503 }), isFetching: true })
    expect(AgentProfile().props.children[0].props.agent).toBe(profile.data)
    expect(CopyDetail({ backPath: 'my-copies' }).props.children[0].props.agent).toBe(profile.data)
  })

  it('never renders previous-argument data after a failed navigation', () => {
    mocks.copyRun.mockReturnValue({ ...query(undefined, { status: 503 }), data: run })
    expect(CopyDetail({ backPath: 'my-copies' }).props.children.type).toBe('read-error')
    mocks.agent.mockReturnValue({ ...query(undefined, { status: 503 }), data: profile })
    expect(AgentProfile().props.children.type).toBe('read-error')
  })

  it('preserves the loader for initial reads and wallet restoration', () => {
    mocks.agent.mockReturnValue({ ...query(), isFetching: true })
    expect(AgentProfile().props.children.type).toBe('loader')
    expect(CopyDetail({ backPath: 'my-copies' }).props.children[1].props.run).toBe(run.data)
    mocks.copyRun.mockReturnValue({ ...query(), isFetching: true })
    expect(CopyDetail({ backPath: 'my-copies' }).props.children.type).toBe('loader')
    mocks.restoring.mockReturnValue(true)
    mocks.agent.mockReturnValue(query(undefined, { status: 503 }))
    expect(AgentProfile().props.children.type).toBe('loader')
    expect(CopyDetail({ backPath: 'my-copies' }).props.children.type).toBe('loader')
  })

  it('preserves public Agent access and wallet-required Copy Detail', () => {
    mocks.context.mockReturnValue({ ...chainContext, ownerAddress: undefined })
    mocks.copyRuns.mockReturnValue({ ...query(), isUninitialized: true })
    expect(AgentProfile().props.children[0].props.agent).toBe(profile.data)
    expect(CopyDetail({ backPath: 'my-copies' }).props.children.type).toBe('wallet-required')
  })
})
