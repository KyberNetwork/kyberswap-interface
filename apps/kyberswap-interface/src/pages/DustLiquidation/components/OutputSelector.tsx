import { ChainId as SchemaChainId, Token as SchemaToken } from '@kyber/schema'
import TokenSelectorModal from '@kyber/token-selector'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

import Logo from 'components/Logo'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.buttonBlack};
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
  :hover {
    filter: brightness(1.12);
  }
`

const Placeholder = styled(Pill)`
  color: ${({ theme }) => theme.primary};
`

const OutputSelector = () => {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { outputToken } = useDustLiquidationState()
  const { updateOutput } = useDustLiquidationActions()
  const [showModal, setShowModal] = useState(false)

  const onSelect = (token: SchemaToken) => {
    updateOutput({
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      logo: token.logo,
    })
    setShowModal(false)
  }

  return (
    <>
      {outputToken ? (
        <Pill type="button" onClick={() => setShowModal(true)}>
          <Logo
            srcs={outputToken.logo ? [outputToken.logo] : []}
            alt={outputToken.symbol}
            style={{ width: 20, height: 20, borderRadius: 999 }}
          />
          {outputToken.symbol}
          <ChevronDown size={16} />
        </Pill>
      ) : (
        <Placeholder type="button" onClick={() => setShowModal(true)}>
          <Trans>Select token</Trans>
          <ChevronDown size={16} />
        </Placeholder>
      )}

      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <TokenSelectorModal
            chainId={chainId as unknown as SchemaChainId}
            onClose={() => setShowModal(false)}
            wallet={{ account, onConnectWallet: toggleWalletModal }}
            tokenOptions={{ onTokenSelect: onSelect }}
          />,
          document.body,
        )}
    </>
  )
}

export default OutputSelector
