import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'

import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import WarningNote from 'components/WarningNote'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useSwitchPairToLimitOrder } from 'state/swap/hooks'
import { checkPriceImpact } from 'utils/prices'

type Props = {
  gasUsd?: string
  priceImpact?: number
  isDegenMode: boolean
}

const GAS_USD_THRESHOLD = 20
const GasFeeAndPriceImpactNote: FC<Props> = ({ gasUsd = 0, priceImpact, isDegenMode }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const switchToLimitOrder = useSwitchPairToLimitOrder()
  const { isHigh, isVeryHigh } = checkPriceImpact(priceImpact)

  if (+gasUsd < GAS_USD_THRESHOLD || chainId !== ChainId.MAINNET)
    return <PriceImpactNote priceImpact={priceImpact} isDegenMode={isDegenMode} showLimitOrderLink />

  const limitOrderLink = (
    <Trans>
      Do you want to make a{' '}
      <Text as="span" sx={{ cursor: 'pointer', fontWeight: 'bold' }} color={theme.primary} onClick={switchToLimitOrder}>
        Limit Order
      </Text>{' '}
      instead?
    </Trans>
  )
  return (
    <WarningNote
      shortText={
        <Text>
          {isHigh || isVeryHigh ? (
            <Trans>Gas fees and Price Impact are very high. You will lose your funds.</Trans>
          ) : (
            <Trans>Gas fees is very high. You will lose your funds.</Trans>
          )}{' '}
          {limitOrderLink}
        </Text>
      }
    />
  )
}

export default GasFeeAndPriceImpactNote
