import { ChainId } from '@kyberswap/ks-sdk-core'
import { LiquidityWidget as KsLiquidityWidget } from 'kyberswap-pancake-liquidity-widgets'
import 'kyberswap-pancake-liquidity-widgets/dist/style.css'
import { useEffect, useState } from 'react'
import { Box } from 'rebass'
import { useAccount, useWalletClient } from 'wagmi'

import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import { NetworkSelector } from 'components/NetworkSelector'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

export default function LiquidityWidget() {
  const [selectedChainId, setSelectedChainId] = useState(ChainId.ARBITRUM)
  const [poolAddress, setPoolAddress] = useState('0x641C00A822e8b671738d32a431a4Fb6074E5c79d')
  const [positionId, setPositionId] = useState('') //24654
  const [initDepositTokens, setInitDepositTokens] = useState<string>(
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9,0x912CE59144191C1204E64559FE8253a0e49E6548',
  )
  const [initAmounts, setInitAmounts] = useState<string>(',')
  const [openModal, setOpenModal] = useState(false)
  const { changeNetwork } = useChangeNetwork()
  const [autoAfterChange, setAutoAfterChange] = useState(false)

  const { chainId } = useActiveWeb3React()
  const { data: walletClient } = useWalletClient()
  const { address: account } = useAccount()

  useEffect(() => {
    if (autoAfterChange && chainId === selectedChainId) {
      setOpenModal(true)
      setAutoAfterChange(false)
    }
  }, [autoAfterChange, chainId, selectedChainId])

  const [feeAddress, setFeeAddress] = useState('')
  const [feePcm, setFeePcm] = useState(0)

  const tokenSelectModal = <CurrencySearchModal isOpen={true} onDismiss={() => {}} onCurrencySelect={() => {}} />

  return (
    <>
      {openModal ? (
        <KsLiquidityWidget
          onConnectWallet={() => {}}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          walletClient={walletClient as any}
          account={account}
          networkChainId={chainId}
          chainId={selectedChainId}
          positionId={positionId}
          initTickLower={undefined}
          initTickUpper={undefined}
          poolAddress={poolAddress}
          theme={'dark'}
          feeAddress="0xB82bb6Ce9A249076Ca7135470e7CA634806De168"
          feePcm={0}
          onDismiss={() => {
            window.location.reload()
          }}
          initDepositTokens={initDepositTokens}
          initAmounts={initAmounts}
          source="zap-widget-demo"
          tokenSelectModal={tokenSelectModal}
          // walletClient={walletClient as any}
          // poolAddress={poolAddress}
          // positionId={positionId || undefined}
          // feeAddress={feeAddress}
          // feePcm={feePcm}
          // chainId={selectedChainId}
          // onTxSubmit={tx => {
          //   notify(
          //     {
          //       title: 'Send Zap tx success',
          //       type: NotificationType.SUCCESS,
          //       summary: `Tx: ${tx}`,
          //       // icon?: ReactNode
          //       // link: getEtherscanLink(ChainId.ARBITRUM, tx, 'transaction'),
          //     },
          //     10_000,
          //   )
          // }}
          // onDismiss={() => setOpenModal(false)}
          // source={'kyberswap-demo-zap'}
        />
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

          <Input placeholder="Pool address..." value={poolAddress} onChange={e => setPoolAddress(e.target.value)} />
          <Input placeholder="Position id..." value={positionId} onChange={e => setPositionId(e.target.value)} />

          <Input
            placeholder="initDepositTokens..."
            value={initDepositTokens}
            onChange={e => setInitDepositTokens(e.target.value)}
          />
          <Input placeholder="initAmounts..." value={initAmounts} onChange={e => setInitAmounts(e.target.value)} />

          <Input placeholder="Fee address..." value={feeAddress} onChange={e => setFeeAddress(e.target.value)} />
          <Input placeholder="Fee pcm..." value={feePcm} onChange={e => setFeePcm(+e.target.value)} />
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
