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

const STORAGE_KEY = 'connectedWallets'

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

  const [theme, setTheme] = useState<WidgetTheme>(DARK_THEME)
  const [chainId, setChainId] = useState<number>(1)
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
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[]
    if (stored[0]) connect({ autoSelect: { label: stored[0], disableModals: true } }).catch(() => {})
  }, [connect])

  useEffect(() => {
    if (wallet) localStorage.setItem(STORAGE_KEY, JSON.stringify([wallet.label]))
  }, [wallet])

  const themeName: 'dark' | 'light' | 'custom' =
    theme === DARK_THEME ? 'dark' : theme === LIGHT_THEME ? 'light' : 'custom'

  return (
    <div className="app">
      <div className="controls">
        <h1>KyberSwap Widget Demo</h1>

        <button className="button" onClick={() => (wallet ? disconnect(wallet) : connect())}>
          {wallet ? 'Disconnect' : 'Connect Wallet'}
        </button>

        <p className="title">Theme</p>
        <div className="row-center">
          {(['dark', 'light', 'custom'] as const).map(name => (
            <label key={name}>
              <input
                type="radio"
                name="theme"
                checked={themeName === name}
                onChange={() =>
                  setTheme(name === 'dark' ? DARK_THEME : name === 'light' ? LIGHT_THEME : undefined)
                }
              />{' '}
              {name[0].toUpperCase() + name.slice(1)}
            </label>
          ))}
        </div>

        <div className="row">
          <label>chainId</label>
          <select value={chainId} onChange={e => setChainId(Number(e.target.value))}>
            {CHAINS.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <p className="title">Charge fee</p>
        <div className="row">
          <label>chargeFeeBy</label>
          <div className="row-center">
            {(['currency_in', 'currency_out'] as const).map(v => (
              <label key={v}>
                <input
                  type="radio"
                  name="chargeFeeBy"
                  checked={feeSetting.chargeFeeBy === v}
                  onChange={() => setFeeSetting(s => ({ ...s, chargeFeeBy: v }))}
                />{' '}
                {v}
              </label>
            ))}
          </div>
        </div>

        <div className="row">
          <label>feeReceiver</label>
          <input
            value={feeSetting.feeReceiver}
            onChange={e => setFeeSetting(s => ({ ...s, feeReceiver: e.target.value }))}
          />
        </div>

        <div className="row">
          <label>feeAmount</label>
          <input
            type="number"
            value={feeSetting.feeAmount}
            onChange={e => setFeeSetting(s => ({ ...s, feeAmount: Number(e.target.value) }))}
          />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <label>
            <input
              type="checkbox"
              checked={feeSetting.isInBps}
              onChange={e => setFeeSetting(s => ({ ...s, isInBps: e.target.checked }))}
            />{' '}
            isInBps
          </label>
        </div>

        <p className="title">Display</p>
        <div className="row-center">
          <label>
            <input type="checkbox" checked={showRate} onChange={e => setShowRate(e.target.checked)} />{' '}
            Show rate
          </label>
          <label>
            <input
              type="checkbox"
              checked={showDetail}
              onChange={e => setShowDetail(e.target.checked)}
            />{' '}
            Show detail
          </label>
        </div>

        <p className="title">Trade route</p>
        <div className="row-center">
          {[true, false].map(v => (
            <label key={String(v)}>
              <input
                type="radio"
                name="trade-route"
                checked={enableRoute === v}
                onChange={() => setEnableRoute(v)}
              />{' '}
              {v ? 'Enable' : 'Disable'}
            </label>
          ))}
        </div>

        <p className="title">Enable dexes</p>
        <input
          type="text"
          value={enableDexes}
          onChange={e => setEnableDexes(e.target.value)}
          placeholder="comma-separated dex IDs"
          style={{ width: '100%' }}
        />
      </div>

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
    </div>
  )
}
