import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { lighten } from 'polished'
import { useMemo } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import Card from 'components/Card'
import NetworkModal from 'components/Header/web3/NetworkModal'
import Row from 'components/Row'
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
import { formatDisplayNumber } from 'utils/numbers'

const NetworkSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-width: fit-content;
`

const NetworkCard = styled(Card)`
  position: relative;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid transparent;
  width: fit-content;

  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
    cursor: pointer;
    background-color: ${({ theme }) => lighten(0.05, theme.background)};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    width: initial;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: auto;
  `};
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
  min-width: 24px;
`

const NetworkLabel = styled.div`
  white-space: nowrap;
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

function SelectNetwork(): JSX.Element | null {
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
    <NetworkCard
      onClick={() => (disableSelectNetwork ? null : toggleNetworkModal())}
      role="button"
      id={TutorialIds.SELECT_NETWORK}
      data-testid="select-network"
    >
      <NetworkSwitchContainer>
        <Row gap="10px">
          <img src={networkInfo.icon} alt={networkInfo.name + ' logo'} style={{ width: 20, height: 20 }} />
          <NetworkLabel>{labelContent}</NetworkLabel>
        </Row>
        <DropdownIcon open={networkModalOpen} />
      </NetworkSwitchContainer>
      <NetworkModal
        deprecatedSoons={[ChainId.ZKSYNC]}
        selectedId={chainId}
        disabledMsg={t`Unsupported by your wallet.`}
        activeChainIds={[NonEvmChain.Bitcoin, NonEvmChain.Near, ...supportedChains.map(item => item.chainId)]}
      />
    </NetworkCard>
  )
  if (disableSelectNetwork)
    return (
      <MouseoverTooltip text={t`Unable to switch network. Please try it on your wallet.`}>{button}</MouseoverTooltip>
    )
  return button
}

export default SelectNetwork
