import { useEffect, useState } from 'react'
import injectedModule from '@web3-onboard/injected-wallets'
import { init, useConnectWallet } from '@web3-onboard/react'
import walletConnectModule from '@web3-onboard/walletconnect'
import { ethers } from 'ethers'
import dynamic from 'next/dynamic'

// Widget reads localStorage and fetches token data at mount, which produces a
// hydration mismatch under SSR. Render it on the client only.
const Widget = dynamic(() => import('@kyberswap/widgets').then(m => m.Widget), {
  ssr: false,
})

const CHAINS = [
  { id: 1, label: 'Ethereum', token: 'ETH', rpcUrl: 'https://ethereum-rpc.kyberswap.com' },
  { id: 137, label: 'Polygon', token: 'MATIC', rpcUrl: 'https://polygon-rpc.com' },
] as const

const DEFAULT_TOKEN_OUT: Record<number, string> = {
  1: '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
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
  })),
})

export default function Home() {
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [theme, setTheme] = useState<WidgetTheme>(DARK_THEME)
  const [feeSetting, setFeeSetting] = useState({
    feeAmount: 0,
    feeReceiver: '',
    chargeFeeBy: 'currency_in' as 'currency_in' | 'currency_out',
    isInBps: true,
  })

  const chainId = wallet ? Number(wallet.chains[0]?.id ?? '0x1') : 1

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
      </div>

      <Widget
        theme={theme}
        tokenList={[]}
        client="widget-nextjs-demo"
        chainId={chainId}
        connectedAccount={{
          address: wallet?.accounts?.[0]?.address,
          chainId,
        }}
        defaultTokenOut={DEFAULT_TOKEN_OUT[chainId]}
        feeSetting={feeSetting.feeAmount && feeSetting.feeReceiver ? feeSetting : undefined}
        enableRoute
        onSubmitTx={async txData => {
          if (!wallet) throw new Error('No wallet connected')
          const provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
          const tx = await provider.getSigner().sendTransaction(txData)
          return tx.hash
        }}
      />
    </div>
  )
}
