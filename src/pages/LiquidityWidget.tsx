import { ChainId } from '@kyberswap/ks-sdk-core'
import { LiquidityWidget as KsLiquidityWidget, PoolType } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useEffect, useState } from 'react'
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
  const [selectedChainId, setSelectedChainId] = useState(ChainId.MATIC)
  const [poolAddress, setPoolAddress] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const { changeNetwork } = useChangeNetwork()
  const [autoAfterChange, setAutoAfterChange] = useState(false)

  const { chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  useEffect(() => {
    if (autoAfterChange && chainId === selectedChainId) {
      setOpenModal(true)
      setAutoAfterChange(false)
    }
  }, [autoAfterChange, chainId, selectedChainId])

  const [maxWidth, setMaxWidth] = useState('680px')

  return (
    <>
      <StyledModal isOpen={openModal} onDismiss={() => setOpenModal(false)} width="100%" maxWidth={maxWidth}>
        <KsLiquidityWidget
          provider={library}
          theme={{
            primary: '#1C1C1C',
            secondary: '#0F0F0F',
            text: '#FFFFFF',
            subText: '#A9A9A9',
            interactive: '#292929',
            dialog: '#313131',
            stroke: '#505050',
            accent: '#28E0B9',

            success: '#189470',
            warning: '#FF9901',
            error: '#F84242',
            fontFamily: 'Work Sans',
            borderRadius: '10px',
            buttonRadius: '10px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.04)',
          }}
          poolAddress={poolAddress}
          poolType={PoolType.DEX_UNISWAPV3}
          chainId={selectedChainId}
          onDismiss={() => setOpenModal(false)}
          onTogglePreview={show => {
            if (show) setMaxWidth('500px')
            else setMaxWidth('680px')
          }}
        />
      </StyledModal>
      <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', gap: '1rem', width: '100%' }}>
        <NetworkSelector chainId={selectedChainId} customOnSelectNetwork={chain => setSelectedChainId(chain)} />
        <Input placeholder="Pool address..." value={poolAddress} onChange={e => setPoolAddress(e.target.value)} />
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
          Launch
        </ButtonPrimary>
      </Box>
    </>
  )
}
