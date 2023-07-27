import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { ChevronsUp, Minus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ActionButton } from 'pages/MyEarnings/ActionButton'

const ActionButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  ${ActionButton} {
    flex: 1;
    gap: 4px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 8px;

    ${ActionButton} {
      padding: 8px;
      font-size: 11px;
    }
  `}
`

type ActionButtonsProps = {
  liquidity: number | undefined
  chainId: ChainId
  nftId: string
  currency0: Currency
  currency1: Currency
  feeAmount: FeeAmount
  isLegacy: boolean
  onRemoveLiquidityFromLegacyPosition: () => void
}
const ActionButtons: React.FC<ActionButtonsProps> = ({
  chainId,
  nftId,
  currency0,
  currency1,
  feeAmount,
  liquidity,
  isLegacy,
  onRemoveLiquidityFromLegacyPosition,
}) => {
  const { chainId: currentChainId } = useActiveWeb3React()
  const chainRoute = NETWORKS_INFO[chainId].route

  const currency0Slug = currency0.isNative ? currency0.symbol : currency0.wrapped.address
  const currency1Slug = currency1.isNative ? currency1.symbol : currency1.wrapped.address

  const { changeNetwork } = useChangeNetwork()
  const navigate = useNavigate()

  const target = `/${chainRoute}${APP_PATHS.ELASTIC_INCREASE_LIQ}/${currency0Slug}/${currency1Slug}/${feeAmount}/${nftId}`

  const onIncreaseClick = (e: any) => {
    if (currentChainId !== chainId) {
      e.preventDefault()
      changeNetwork(chainId, () => {
        navigate(target)
      })
    }
  }

  const targetRemove = `/${chainRoute}${APP_PATHS.ELASTIC_REMOVE_POOL}/${nftId}`

  const onRemoveClick = (e: any) => {
    if (currentChainId !== chainId) {
      e.preventDefault()
      changeNetwork(chainId, () => {
        navigate(targetRemove)
      })
    }
  }

  const renderRemoveButton = () => {
    if (!liquidity || isLegacy) {
      return (
        <ActionButton $variant="red" disabled={!liquidity} onClick={onRemoveLiquidityFromLegacyPosition}>
          <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton $variant="red" as={Link} to={targetRemove} onClick={onRemoveClick}>
        <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
      </ActionButton>
    )
  }

  const renderIncreaseButton = () => {
    if (isLegacy) {
      return (
        <ActionButton $variant="green" disabled>
          <ChevronsUp size="16px" /> <Trans>Increase Liquidity</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton $variant="green" as={Link} onClick={onIncreaseClick} to={target}>
        <ChevronsUp size="16px" /> <Trans>Increase Liquidity</Trans>
      </ActionButton>
    )
  }

  return (
    <ActionButtonsWrapper>
      {renderRemoveButton()}
      {renderIncreaseButton()}
    </ActionButtonsWrapper>
  )
}

export default ActionButtons
