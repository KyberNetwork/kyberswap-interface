import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'

import WarningNote from 'components/WarningNote'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useSwitchPairToLimitOrder } from 'state/swap/hooks'

type Props = {
  gasUsd?: string
}

const GAS_USD_THRESHOLD = 20
const GasPriceNote: FC<Props> = ({ gasUsd = 0 }) => {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()
  const switchToLimitOrder = useSwitchPairToLimitOrder()
  if (+gasUsd < GAS_USD_THRESHOLD || chainId !== ChainId.MAINNET) return null

  return (
    <WarningNote
      shortText={t`Gas fee is higher than $${GAS_USD_THRESHOLD}.`}
      longText={
        <Text>
          <Trans>
            Do you want to make a{' '}
            <Text as="b" sx={{ cursor: 'pointer' }} color={theme.primary} onClick={switchToLimitOrder}>
              Limit Order
            </Text>{' '}
            instead?
          </Trans>
        </Text>
      }
    />
  )
}

export default GasPriceNote
