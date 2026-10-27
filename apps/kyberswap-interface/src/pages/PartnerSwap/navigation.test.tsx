// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'

import PartnerSwap from 'pages/PartnerSwap'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { type MainTab, TAB } from 'pages/Swap/layout/Tabs'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ chainId: 1, account: 'connected', networkInfo: { route: 'ethereum' } }),
}))
vi.mock('hooks/useChainsConfig', () => ({ NETWORKS_INFO: { 1: { route: 'ethereum' } } }))
vi.mock('hooks/useTokens', () => ({ useCurrencyV2: () => undefined }))
vi.mock('hooks/web3/useChangeNetwork', () => ({ useChangeNetwork: () => ({ changeNetwork: vi.fn() }) }))
vi.mock('services/tipLink', () => ({ useGetTipLinkQuery: () => ({}) }))
vi.mock('state/customizeDexes/updater', () => ({ default: () => null }))
vi.mock('components/TipLinkGeneratorModal/shared', () => ({
  DEFAULT_TIP: 100,
  TIP_LINK_CLIENT_ID: 'tip',
  isCreatorNameValid: () => true,
}))
vi.mock('pages/Swap/layout/Tabs', () => ({
  TAB: {
    SWAP: 'swap',
    LIMIT: 'limit',
    INFO: 'info',
    SETTINGS: 'settings',
    LIQUIDITY_SOURCES: 'liquidity_sources',
    CROSS_CHAIN_SOURCES: 'cross_chain_sources',
  },
  isSettingTab: (tab: string) => ['info', 'settings', 'liquidity_sources', 'cross_chain_sources'].includes(tab),
}))
vi.mock('pages/Swap/SwapPage', () => ({ default: () => <Form mainTab={TAB.SWAP} /> }))
vi.mock('pages/Swap/LimitPage', () => ({ default: () => <Form mainTab={TAB.LIMIT} /> }))

const Form = ({ mainTab }: { mainTab: MainTab }) => {
  const controller = useTradeController(mainTab)
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output>{location.pathname + location.search}</output>
      <span data-panel>{controller.activeTab}</span>
      <span data-main>{controller.activeMainTab}</span>
      <button onClick={() => controller.onTabChange(TAB.INFO)}>Info</button>
      <button onClick={() => controller.onTabChange(TAB.SETTINGS)}>Settings</button>
      <button onClick={() => controller.onTabChange(TAB.LIQUIDITY_SOURCES)}>Sources</button>
      <button onClick={controller.onBackToMainTab}>Return</button>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  )
}

let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
const mount = async (url: string) => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[url]}>
        {url.startsWith('/swap') ? (
          <Form mainTab={TAB.SWAP} />
        ) : (
          <PartnerSwap mode={url.startsWith('/user-swap') ? 'user' : 'partner'} />
        )}
      </MemoryRouter>,
    )
  })
}
const click = async (label: string) => {
  const button = [...container.querySelectorAll('button')].find(button => button.textContent === label)
  expect(button).toBeTruthy()
  if (!button) throw new Error(`Missing button: ${label}`)
  await act(async () => button.click())
}
const params = () => new URL(container.querySelector('output')?.textContent || '', 'https://kyberswap.com').searchParams
const panel = () => container.querySelector('[data-panel]')?.textContent

afterEach(async () => {
  await act(async () => root?.unmount())
  container?.remove()
})

it.each(['info', 'settings', 'liquidity_sources'])(
  'opens an embedded %s link without consuming its tab parameter',
  async tab => {
    await mount(`/partner-swap?clientId=partner&chainId=1&tab=${tab}`)
    expect(panel()).toBe(tab)
    expect(params().get('tab')).toBe(tab)
  },
)

it('writes panel transitions and restores them with browser back while retaining attribution', async () => {
  await mount(
    '/partner-swap?clientId=partner&chainId=1&tab=swap&feeAmount=25&feeReceiver=0x0000000000000000000000000000000000000001',
  )
  await click('Settings')
  expect(params().get('tab')).toBe('settings')
  await click('Sources')
  expect(params().get('tab')).toBe('liquidity_sources')
  await click('Return')
  expect(params().get('tab')).toBe('swap')
  await click('Back')
  expect(panel()).toBe('liquidity_sources')
  await click('Back')
  expect(panel()).toBe('settings')
  expect(params().get('clientId')).toBe('partner')
  expect(params().get('feeAmount')).toBe('25')
})

it.each(['/partner-swap', '/user-swap'])('returns to Limit Order after opening Info on %s', async pathname => {
  await mount(`${pathname}?clientId=partner&chainId=1&tab=limit`)
  await click('Info')
  expect(panel()).toBe('info')
  expect(container.querySelector('[data-main]')?.textContent).toBe('limit')
  expect(params().get('tab')).toBe('info')
  await click('Return')
  expect(panel()).toBe('limit')
  expect(params().get('tab')).toBe('limit')
})

it('opens required Degen settings with one URL update', async () => {
  await mount('/partner-swap?clientId=partner&tab=swap&enableDegenMode=true')
  expect(panel()).toBe('settings')
  expect(params().get('tab')).toBe('settings')
  expect(params().has('enableDegenMode')).toBe(false)
})

it('preserves one-shot settings URLs and local panel state on public Swap', async () => {
  await mount('/swap/ethereum?tab=settings')
  expect(panel()).toBe('settings')
  expect(params().has('tab')).toBe(false)
  await click('Info')
  expect(panel()).toBe('info')
  expect(params().has('tab')).toBe(false)
})
