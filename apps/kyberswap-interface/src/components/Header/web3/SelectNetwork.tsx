import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import Card from 'components/Card'
import NetworkModal from 'components/Header/web3/NetworkModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import { useWalletSupportedChains } from 'hooks/web3/useWalletSupportedChains'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useNativeBalance } from 'state/wallet/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

function SelectNetwork(): React.JSX.Element | null {
  const { chainId, networkInfo } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const userEthBalance = useNativeBalance()
  const labelContent = useMemo(() => {
    if (!userEthBalance) return networkInfo.name
    const balanceFixedStr = formatDisplayNumber(userEthBalance, { significantDigits: 6 })
    return `${balanceFixedStr} ${NativeCurrencies[chainId].symbol}`
  }, [userEthBalance, chainId, networkInfo])
  const walletSupportsChain = useWalletSupportedChains()
  const disableSelectNetwork = walletSupportsChain.length <= 1

  const { supportedChains } = useChainsConfig()

  const button = (
    <Card
      onClick={() => (disableSelectNetwork ? null : toggleNetworkModal())}
      role="button"
      id={TutorialIds.SELECT_NETWORK}
      data-testid="select-network"
      className={cn(
        'relative w-fit rounded-full border border-transparent bg-background px-3 py-2 text-text',
        'hover:cursor-pointer hover:border-primary hover:bg-background hover:no-underline hover:brightness-105',
        'max-sm:m-0 max-sm:w-auto max-sm:min-w-0 max-sm:flex-shrink max-sm:[text-overflow:ellipsis]',
      )}
    >
      <div className="flex w-full min-w-fit items-center justify-between">
        <div className="flex w-max shrink-0 items-center gap-2.5">
          <img src={networkInfo.icon} alt={networkInfo.name + ' logo'} style={{ width: 20, height: 20 }} />
          <div className="whitespace-nowrap font-medium max-sm:hidden">{labelContent}</div>
        </div>
        <DropdownSvg
          className={cn('min-w-[24px] text-text transition-transform duration-300', networkModalOpen && 'rotate-180')}
        />
      </div>
      <NetworkModal
        deprecatedSoons={[ChainId.ZKSYNC, ChainId.MANTLE]}
        selectedId={chainId}
        disabledMsg={t`Unsupported by your wallet.`}
        activeChainIds={[NonEvmChain.Bitcoin, NonEvmChain.Near, ...supportedChains.map(item => item.chainId)]}
      />
    </Card>
  )
  if (disableSelectNetwork)
    return (
      <MouseoverTooltip text={t`Unable to switch network. Please try it on your wallet.`}>{button}</MouseoverTooltip>
    )
  return button
}

export default SelectNetwork
