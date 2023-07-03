import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { ChevronsUp, Minus } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
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
  isIncreaseDisabled: boolean
}
const ActionButtons: React.FC<ActionButtonsProps> = ({
  chainId,
  nftId,
  currency0,
  currency1,
  feeAmount,
  liquidity,
  isIncreaseDisabled,
}) => {
  const chainRoute = NETWORKS_INFO[chainId].route

  const currency0Slug = currency0.isNative ? currency0.symbol : currency0.wrapped.address
  const currency1Slug = currency1.isNative ? currency1.symbol : currency1.wrapped.address

  const renderRemoveButton = () => {
    if (!liquidity) {
      return (
        <ActionButton $variant="red" disabled>
          <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton $variant="red" as={Link} to={`/${chainRoute}${APP_PATHS.ELASTIC_REMOVE_POOL}/${nftId}`}>
        <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
      </ActionButton>
    )
  }

  const renderIncreaseButton = () => {
    if (!liquidity || isIncreaseDisabled) {
      return (
        <ActionButton $variant="green" disabled>
          <ChevronsUp size="16px" /> <Trans>Increase Liquidity</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton
        $variant="green"
        as={Link}
        to={`/${chainRoute}${APP_PATHS.ELASTIC_INCREASE_LIQ}/${currency0Slug}/${currency1Slug}/${feeAmount}/${nftId}`}
      >
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
