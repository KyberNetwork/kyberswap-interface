import { useEffect, useState } from 'react'
import { Widget } from '@kyberswap/widgets'
import injectedModule from '@web3-onboard/injected-wallets'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'
import walletConnectModule from '@web3-onboard/walletconnect'
import { ethers } from 'ethers'
import './App.css'

const CHAINS = [
  { id: 1, label: 'Ethereum', token: 'ETH', rpcUrl: 'https://ethereum-rpc.kyberswap.com' },
  { id: 56, label: 'BSC', token: 'BNB', rpcUrl: 'https://bsc-dataseed.binance.org/' },
  { id: 8453, label: 'Base', token: 'ETH', rpcUrl: 'https://mainnet.base.org' },
  { id: 80094, label: 'Berachain', token: 'BERA', rpcUrl: 'https://rpc.berachain.com' },
  { id: 146, label: 'Sonic', token: 'S', rpcUrl: 'https://rpc.soniclabs.com' },
  { id: 999, label: 'HyperEVM', token: 'HYPE', rpcUrl: 'https://rpc.hyperliquid.xyz/evm' },
  { id: 9745, label: 'Plasma', token: 'XPL', rpcUrl: 'https://rpc.plasma.to' },
  { id: 42793, label: 'Etherlink', token: 'XTZ', rpcUrl: 'https://node.mainnet.etherlink.com' },
  { id: 143, label: 'Monad', token: 'MON', rpcUrl: 'https://rpc.monad.xyz' },
  { id: 4326, label: 'MegaETH', token: 'ETH', rpcUrl: 'https://mainnet.megaeth.com/rpc' },
  { id: 4153, label: 'Rise', token: 'ETH', rpcUrl: 'https://rpc.risechain.com' },
] as const

const DEFAULT_TOKEN_OUT: Record<number, string> = {
  1: '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202',
  56: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  8453: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  80094: '0x549943e04f40284185054145c6e4e9568c1d3241',
  146: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
  999: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  9745: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
  42793: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
  143: '0xe7cd86e13AC4309349F30B3435a9d337750fC82D',
  4326: '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7',
  4153: '0xe436820ba0c69702c1d3e601d421c0ef38262739',
}

const DARK_THEME = {
  text: '#FFFFFF',
  subText: '#A9A9A9',
  primary: '#1C1C1C',
  dialog: '#313131',
  secondary: '#0F0F0F',
  interactive: '#292929',
  stroke: '#505050',
  accent: '#28E0B9',
  success: '#189470',
  warning: '#FF9901',
  error: '#FF537B',
  fontFamily: 'Work Sans',
  borderRadius: '16px',
  buttonRadius: '999px',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.04)',
}

const LIGHT_THEME = {
  ...DARK_THEME,
  text: '#222222',
  subText: '#5E5E5E',
  primary: '#FFFFFF',
  dialog: '#FBFBFB',
  secondary: '#F5F5F5',
  interactive: '#E2E2E2',
}

type WidgetTheme = typeof DARK_THEME | undefined
type AppTheme = 'dark' | 'light'

const STORAGE_KEY = 'connectedWallets'
const APP_THEME_KEY = 'demoAppTheme'

init({
  wallets: [
    injectedModule(),
    walletConnectModule({
      projectId: 'b03ed6d8451c1e05022897815db0ad0b',
      // Only Ethereum is required so WalletConnect can pair with wallets that
      // don't yet support the newer chains (Rise, Monad, HyperEVM, …).
      requiredChains: [1],
      optionalChains: CHAINS.filter(c => c.id !== 1).map(c => c.id),
      dappUrl: 'http://kyberswap.com',
    }),
  ],
  appMetadata: {
    name: 'KyberSwap Widget Demo',
    description: 'KyberSwap aggregator widget demo',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' },
      { name: 'Coinbase Wallet', url: 'https://www.coinbase.com/wallet' },
    ],
  },
  chains: CHAINS.map(c => ({
    id: `0x${c.id.toString(16)}`,
    token: c.token,
    label: c.label,
    rpcUrl: c.rpcUrl,
    namespace: 'evm',
  })),
})

export default function App() {
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [, setChain] = useSetChain()

  const [appTheme, setAppTheme] = useState<AppTheme>(
    () => (typeof window !== 'undefined' && (localStorage.getItem(APP_THEME_KEY) as AppTheme)) || 'dark',
  )
  const [theme, setTheme] = useState<WidgetTheme>(DARK_THEME)
  const [chainId, setChainId] = useState(1)
  const [feeSetting, setFeeSetting] = useState({
    feeAmount: 0,
    feeReceiver: '',
    chargeFeeBy: 'currency_in' as 'currency_in' | 'currency_out',
    isInBps: true,
  })
  const [enableRoute, setEnableRoute] = useState(true)
  const [enableDexes, setEnableDexes] = useState('')
  const [showRate, setShowRate] = useState(true)
  const [showDetail, setShowDetail] = useState(true)

  const connectedChainId = wallet ? Number(wallet.chains[0]?.id ?? '0x1') : 1

  useEffect(() => {
    document.documentElement.classList.toggle('dark', appTheme === 'dark')
    localStorage.setItem(APP_THEME_KEY, appTheme)
  }, [appTheme])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[]
    if (stored[0]) connect({ autoSelect: { label: stored[0], disableModals: true } }).catch(() => {})
  }, [connect])

  useEffect(() => {
    if (wallet) localStorage.setItem(STORAGE_KEY, JSON.stringify([wallet.label]))
  }, [wallet])

  const themeName: 'dark' | 'light' | 'custom' =
    theme === DARK_THEME ? 'dark' : theme === LIGHT_THEME ? 'light' : 'custom'

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        connected={!!wallet}
        onConnect={() => (wallet ? disconnect(wallet) : connect())}
        appTheme={appTheme}
        onToggleAppTheme={() => setAppTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-4">
          <Card title="Display">
            <Row label="Widget theme">
              <SegmentedControl
                value={themeName}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'custom', label: 'Custom' },
                ]}
                onChange={v =>
                  setTheme(v === 'dark' ? DARK_THEME : v === 'light' ? LIGHT_THEME : undefined)
                }
              />
            </Row>
            <Row label="Chain">
              <Select
                value={chainId}
                onChange={v => setChainId(Number(v))}
                options={CHAINS.map(c => ({ value: c.id, label: c.label }))}
              />
            </Row>
            <Row label="Trade route">
              <SegmentedControl
                value={enableRoute ? 'enable' : 'disable'}
                options={[
                  { value: 'enable', label: 'Enable' },
                  { value: 'disable', label: 'Disable' },
                ]}
                onChange={v => setEnableRoute(v === 'enable')}
              />
            </Row>
            <Row label="Show rate">
              <Toggle checked={showRate} onChange={setShowRate} />
            </Row>
            <Row label="Show detail">
              <Toggle checked={showDetail} onChange={setShowDetail} />
            </Row>
            <Row label="Enable dexes">
              <Input
                value={enableDexes}
                onChange={setEnableDexes}
                placeholder="comma-separated dex IDs"
              />
            </Row>
          </Card>

          <Card title="Charge fee">
            <Row label="chargeFeeBy">
              <SegmentedControl
                value={feeSetting.chargeFeeBy}
                options={[
                  { value: 'currency_in', label: 'in' },
                  { value: 'currency_out', label: 'out' },
                ]}
                onChange={v => setFeeSetting(s => ({ ...s, chargeFeeBy: v }))}
              />
            </Row>
            <Row label="feeReceiver">
              <Input
                value={feeSetting.feeReceiver}
                onChange={v => setFeeSetting(s => ({ ...s, feeReceiver: v }))}
                placeholder="0x…"
              />
            </Row>
            <Row label="feeAmount">
              <Input
                type="number"
                value={String(feeSetting.feeAmount)}
                onChange={v => setFeeSetting(s => ({ ...s, feeAmount: Number(v) }))}
                className="w-32"
              />
            </Row>
            <Row label="isInBps">
              <Toggle
                checked={feeSetting.isInBps}
                onChange={v => setFeeSetting(s => ({ ...s, isInBps: v }))}
              />
            </Row>
          </Card>
        </div>

        <aside className="w-full lg:w-[420px] lg:flex-shrink-0">
          <Widget
            theme={theme}
            tokenList={[]}
            defaultTokenOut={DEFAULT_TOKEN_OUT[chainId]}
            feeSetting={feeSetting.feeAmount && feeSetting.feeReceiver ? feeSetting : undefined}
            client="widget-react-demo"
            chainId={chainId}
            connectedAccount={{
              address: wallet?.accounts?.[0]?.address,
              chainId: connectedChainId,
            }}
            onSubmitTx={async txData => {
              if (!wallet) throw new Error('No wallet connected')
              const provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
              const tx = await provider.getSigner().sendTransaction(txData)
              return tx.hash
            }}
            onSwitchChain={() =>
              setChain({ chainId: `0x${chainId.toString(16)}`, chainNamespace: 'evm' })
            }
            enableRoute={enableRoute}
            enableDexes={enableDexes}
            showDetail={showDetail}
            showRate={showRate}
          />
        </aside>
      </main>

      <Footer />
    </div>
  )
}

function Header({
  connected,
  onConnect,
  appTheme,
  onToggleAppTheme,
}: {
  connected: boolean
  onConnect: () => void
  appTheme: AppTheme
  onToggleAppTheme: () => void
}) {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-baseline gap-2">
          <img src="/favicon.svg" alt="" className="h-6 w-auto self-center" />
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">KyberSwap</span>
          <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
            Widget Demo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAppTheme}
            aria-label={`Switch to ${appTheme === 'dark' ? 'light' : 'dark'} mode`}
            className="rounded-full border border-zinc-300 p-2 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {appTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            onClick={onConnect}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:brightness-110 active:brightness-95"
          >
            {connected ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs text-zinc-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-5 w-auto" />
          <span>
            © {new Date().getFullYear()}{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">KyberSwap</span> — Widget
            Demo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <FooterLink href="https://kyberswap.com">kyberswap.com</FooterLink>
          <FooterLink href="https://docs.kyberswap.com">Docs</FooterLink>
          <FooterLink href="https://github.com/KyberNetwork">GitHub</FooterLink>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="transition hover:text-zinc-700 dark:hover:text-zinc-300"
    >
      {children}
    </a>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
      {title && (
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-500">
          {title}
        </h2>
      )}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="flex max-w-[60%] justify-end">{children}</div>
    </div>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800">
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              'rounded-full px-3 py-1 text-xs font-medium transition ' +
              (active
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200')
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Select<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={e => onChange(e.target.value as unknown as T)}
        className="min-w-[160px] cursor-pointer appearance-none rounded-full bg-zinc-100 py-1 pl-3 pr-7 text-xs font-medium text-zinc-900 outline-none transition focus:ring-1 focus:ring-accent dark:bg-zinc-800 dark:text-white"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4.5 6 7.5 9 4.5" />
      </svg>
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        'rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition focus:ring-1 focus:ring-accent dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 ' +
        (className || 'w-full')
      }
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={
        'relative inline-flex h-5 w-9 items-center rounded-full transition ' +
        (checked ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700')
      }
    >
      <span
        className={
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition ' +
          (checked ? 'translate-x-[18px]' : 'translate-x-[2px]')
        }
      />
    </button>
  )
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
