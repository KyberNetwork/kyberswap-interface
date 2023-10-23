import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ChevronsUp, Minus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import QuickZap, { QuickZapButton } from 'components/ElasticZap/QuickZap'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ActionButton } from 'pages/MyEarnings/ActionButton'

const ActionButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${ActionButton} {
    flex: 1;
    gap: 4px;
    height: 36px;
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
  const [showQuickZap, setShowQuickZap] = useState(false)
  const { chainId: currentChainId } = useActiveWeb3React()
  const chainRoute = NETWORKS_INFO[chainId].route

  const currency0Slug = currency0.isNative ? currency0.symbol : currency0.wrapped.address
  const currency1Slug = currency1.isNative ? currency1.symbol : currency1.wrapped.address

  const { changeNetwork } = useChangeNetwork()
  const navigate = useNavigate()

  const poolAddress = useProAmmPoolInfo(currency0.wrapped, currency1.wrapped, feeAmount)
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
          <Minus size="16px" /> <Trans>Remove</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton $variant="red" as={Link} to={targetRemove} onClick={onRemoveClick}>
        <Minus size="16px" /> <Trans>Remove</Trans>
      </ActionButton>
    )
  }

  const renderIncreaseButton = () => {
    if (isLegacy) {
      return (
        <ActionButton $variant="green" disabled>
          <ChevronsUp size="16px" /> <Trans>Increase</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton $variant="green" as={Link} onClick={onIncreaseClick} to={target}>
        <ChevronsUp size="16px" /> <Trans>Increase</Trans>
      </ActionButton>
    )
  }

  return (
    <ActionButtonsWrapper>
      {renderRemoveButton()}
      {renderIncreaseButton()}
      {!isLegacy && (
        <QuickZapButton
          onClick={e => {
            e.stopPropagation()
            setShowQuickZap(true)
          }}
        />
      )}
      <QuickZap
        poolAddress={poolAddress}
        tokenId={nftId}
        isOpen={showQuickZap}
        expectedChainId={chainId}
        onDismiss={() => setShowQuickZap(false)}
      />
    </ActionButtonsWrapper>
  )
}

export default ActionButtons
