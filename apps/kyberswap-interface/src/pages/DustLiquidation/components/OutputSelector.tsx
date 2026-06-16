import { ChainId as SchemaChainId, Token as SchemaToken } from '@kyber/schema'
import TokenSelectorModal from '@kyber/token-selector'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'react-feather'

import Logo from 'components/Logo'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { cn } from 'utils/cn'

const Pill = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-buttonBlack px-3 py-2 text-sm font-medium text-text hover:brightness-[1.12]',
      className,
    )}
    {...props}
  />
)

const Placeholder = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Pill className={cn('text-primary', className)} {...props} />
)

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
            className="size-5 rounded-full"
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
