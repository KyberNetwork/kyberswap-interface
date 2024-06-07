import { ChainId } from '@kyberswap/ks-sdk-core'
import { LiquidityWidget as KsLiquidityWidget, PoolType } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useEffect, useMemo, useState } from 'react'
import { Box } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import Modal from 'components/Modal'
import { NetworkSelector } from 'components/NetworkSelector'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

const StyledModal = styled(Modal)`
  transition: all 0.2s;
`
export default function LiquidityWidget() {
  const [selectedChainId, setSelectedChainId] = useState(ChainId.ARBITRUM)
  const [poolAddress, setPoolAddress] = useState('0x0bacc7a9717e70ea0da5ac075889bd87d4c81197')
  const [positionId, setPositionId] = useState('24654')
  const [openModal, setOpenModal] = useState(false)
  const { changeNetwork } = useChangeNetwork()
  const [autoAfterChange, setAutoAfterChange] = useState(false)
  console.log(positionId)

  const { chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  useEffect(() => {
    if (autoAfterChange && chainId === selectedChainId) {
      setOpenModal(true)
      setAutoAfterChange(false)
    }
  }, [autoAfterChange, chainId, selectedChainId])

  const pancakeTheme = useMemo(
    () => ({
      text: '#FFFFFF',
      subText: '#B6AECF',
      icons: '#a9a9a9',
      layer1: '#27262C',
      dialog: '#27262C',
      layer2: '#363046',
      stroke: '#363046',
      chartRange: '#5DC5D2',
      chartArea: '#457F89',
      accent: '#5DC5D2',
      warning: '#F4B452',
      error: '#FF5353',
      success: '#189470',
      fontFamily: 'Kanit, Sans-serif',
      borderRadius: '20px',
      buttonRadius: '16px',
      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.04)',
    }),
    [],
  )

  return (
    <>
      {openModal ? (
        <KsLiquidityWidget
          provider={library}
          theme={pancakeTheme}
          poolAddress={poolAddress}
          positionId={positionId || undefined}
          poolType={PoolType.DEX_PANCAKESWAPV3}
          chainId={ChainId.ARBITRUM}
          onDismiss={() => setOpenModal(false)}
          onTogglePreview={() => {
            //
          }}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', gap: '1rem', width: '100%' }}>
          <NetworkSelector chainId={selectedChainId} customOnSelectNetwork={chain => setSelectedChainId(chain)} />
          <Input placeholder="Pool address..." value={poolAddress} onChange={e => setPoolAddress(e.target.value)} />
          <Input placeholder="Position id..." value={positionId} onChange={e => setPositionId(e.target.value)} />
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
