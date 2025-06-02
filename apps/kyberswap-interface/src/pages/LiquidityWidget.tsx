import { ChainId } from '@kyberswap/ks-sdk-core'
import { LiquidityWidget as KsLiquidityWidget, Dex } from '@kyberswap/pancake-liquidity-widgets'
import '@kyberswap/pancake-liquidity-widgets/dist/style.css'
import { useCallback, useEffect, useState } from 'react'
import { Box } from 'rebass'
import { useAccount, useWalletClient } from 'wagmi'

import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import { NetworkSelector } from 'components/NetworkSelector'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useWalletModalToggle } from 'state/application/hooks'

enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
}

export default function LiquidityWidget() {
  const [selectedChainId, setSelectedChainId] = useState(ChainId.BSCMAINNET)
  const [theme, setTheme] = useState<Theme>(Theme.DARK)
  const [poolAddress, setPoolAddress] = useState('0x752e76950f6167b8dbb0495b957d264d61724dfa26e3dd6fad1ba820862ce9cf')
  const [positionId, setPositionId] = useState('')
  const [dex, setDex] = useState<Dex>(Dex.DEX_PANCAKE_INFINITY_CL)
  //   const [feeAddress, setFeeAddress] = useState('')
  //   const [feePcm, setFeePcm] = useState(0)
  const [openModal, setOpenModal] = useState(false)
  const [autoAfterChange, setAutoAfterChange] = useState(false)

  const [initDepositTokens, setInitDepositTokens] = useState<string>('')
  const [initAmounts, setInitAmounts] = useState<string>('')
  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false)

  const { chainId } = useActiveWeb3React()
  const { data: walletClient } = useWalletClient()
  const { address: account } = useAccount()
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()

  useEffect(() => {
    if (autoAfterChange && chainId === selectedChainId) {
      setOpenModal(true)
      setAutoAfterChange(false)
    }
  }, [autoAfterChange, chainId, selectedChainId])

  const handleDismiss = () => setOpenTokenSelectModal(false)

  const handleSelectToken = (token: any) => {
    const selectedToken =
      token.wrapped && !token.isNative ? { ...token, ...token.wrapped } : { ...token, address: ETHER_ADDRESS }
    const tokens = initDepositTokens.split(',')
    const indexOfToken = tokens.findIndex(t => t.toLowerCase() === selectedToken.address?.toLowerCase())

    if (indexOfToken > -1) return
    setInitDepositTokens(
      initDepositTokens ? `${initDepositTokens},${selectedToken.address}` : `${selectedToken.address}`,
    )
    setInitAmounts(initAmounts ? `${initAmounts},` : '')

    handleDismiss()
  }

  // required
  const handleAddTokens = useCallback(
    (tokenAddresses: string) => {
      setInitDepositTokens(initDepositTokens ? `${initDepositTokens},${tokenAddresses}` : tokenAddresses)
      const amountsToAdd = tokenAddresses
        .split('')
        .filter(item => item === ',')
        .join('')
      setInitAmounts(initAmounts ? `${initAmounts},${amountsToAdd}` : amountsToAdd)
    },
    [initAmounts, initDepositTokens],
  )

  // required
  const handleRemoveToken = useCallback(
    (tokenAddress: string) => {
      const tokens = initDepositTokens.split(',')
      const indexOfToken = tokens.findIndex(t => t.toLowerCase() === tokenAddress.toLowerCase())
      if (indexOfToken === -1) return

      tokens.splice(indexOfToken, 1)
      const amounts = initAmounts.split(',')
      amounts.splice(indexOfToken, 1)
      setInitDepositTokens(tokens.join(','))
      setInitAmounts(amounts.join(','))
    },
    [initAmounts, initDepositTokens],
  )

  // required
  const handleAmountChange = useCallback(
    (tokenAddress: string, amount: string) => {
      const tokens = initDepositTokens.split(',')
      const indexOfToken = tokens.findIndex(t => t.toLowerCase() === tokenAddress.toLowerCase())
      if (indexOfToken === -1) return

      const amounts = initAmounts.split(',')
      amounts[indexOfToken] = amount
      setInitAmounts(amounts.join(','))
    },
    [initAmounts, initDepositTokens],
  )

  // required
  const handleOpenTokenSelectModal = useCallback(() => setOpenTokenSelectModal(true), [])

  return (
    <>
      {openModal ? (
        <>
          <KsLiquidityWidget
            theme={theme}
            dex={dex}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            walletClient={walletClient as any}
            account={account}
            chainId={selectedChainId}
            networkChainId={chainId}
            initTickLower={undefined}
            initTickUpper={undefined}
            poolAddress={poolAddress}
            positionId={positionId}
            feeAddress="0xB82bb6Ce9A249076Ca7135470e7CA634806De168"
            feePcm={0}
            source="zap-widget-demo"
            includedSources={undefined}
            excludedSources={undefined}
            initDepositTokens={initDepositTokens}
            initAmounts={initAmounts}
            onConnectWallet={toggleWalletModal}
            onDismiss={() => window.location.reload()}
            onTxSubmit={undefined}
            onAddTokens={handleAddTokens}
            onRemoveToken={handleRemoveToken}
            onAmountChange={handleAmountChange}
            onOpenTokenSelectModal={handleOpenTokenSelectModal}
          />
          <CurrencySearchModal
            isOpen={openTokenSelectModal}
            onDismiss={handleDismiss}
            onCurrencySelect={handleSelectToken}
          />
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '500px',
            gap: '1rem',
            width: '100%',
            color: '#fff',
          }}
        >
          <NetworkSelector chainId={selectedChainId} customOnSelectNetwork={chain => setSelectedChainId(chain)} />

          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <input
                type="radio"
                id="darktheme"
                value={Theme.DARK}
                checked={theme === Theme.DARK}
                onChange={e => setTheme(e.currentTarget.value as Theme)}
              />
                <label htmlFor="darktheme">Dark Theme</label>
            </div>
            <div>
              <input
                type="radio"
                id="lighttheme"
                value={Theme.LIGHT}
                checked={theme === Theme.LIGHT}
                onChange={e => setTheme(e.currentTarget.value as Theme)}
              />
                <label htmlFor="lighttheme">Light Theme</label>
            </div>
          </div>

          <label htmlFor="poolAddress">poolAddress</label>
          <Input
            id="poolAddress"
            placeholder="Pool address..."
            value={poolAddress}
            onChange={e => setPoolAddress(e.target.value)}
          />

          <label htmlFor="positionId">positionId</label>
          <Input
            id="positionId"
            placeholder="Position id..."
            value={positionId}
            onChange={e => setPositionId(e.target.value)}
          />

          <label htmlFor="tokensIn">tokensIn</label>
          <Input
            id="tokensIn"
            placeholder="tokensIn..."
            value={initDepositTokens}
            onChange={e => setInitDepositTokens(e.target.value)}
          />

          <label htmlFor="amountsIn">amountsIn</label>
          <Input
            id="amountsIn"
            placeholder="initAmounts..."
            value={initAmounts}
            onChange={e => setInitAmounts(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <input
                type="radio"
                id="dex-pancake-infinity-cl"
                value={Dex.DEX_PANCAKE_INFINITY_CL}
                checked={dex === Dex.DEX_PANCAKE_INFINITY_CL}
                onChange={e => setDex(e.currentTarget.value as Dex)}
              />
                <label htmlFor="dex-pancake-infinity-cl">Pancake Infinity CL</label>
            </div>
            <div>
              <input
                type="radio"
                id="dex-pancake-v3"
                value={Dex.DEX_PANCAKESWAPV3}
                checked={dex === Dex.DEX_PANCAKESWAPV3}
                onChange={e => setDex(e.currentTarget.value as Dex)}
              />
                <label htmlFor="dex-pancake-v3">PancakeSwap V3</label>
            </div>
          </div>

          {/* <Input placeholder="Fee address..." value={feeAddress} onChange={e => setFeeAddress(e.target.value)} /> */}
          {/* <Input placeholder="Fee pcm..." value={feePcm} onChange={e => setFeePcm(+e.target.value)} /> */}

          <ButtonPrimary
            onClick={() => {
              if (selectedChainId !== chainId) {
                changeNetwork(selectedChainId)
                setAutoAfterChange(true)
              } else {
                setOpenModal(true)
              }
            }}
          >
            Load
          </ButtonPrimary>
        </Box>
      )}
    </>
  )
}
